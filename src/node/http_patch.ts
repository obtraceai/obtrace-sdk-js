import type { ObtraceClient } from "../core/client";
import { createTraceparent, nowUnixNano, parseTraceparent, randomHex } from "../shared/utils";

type HttpModule = {
  createServer: (...args: unknown[]) => unknown;
  request: (...args: unknown[]) => unknown;
  Server?: { prototype: { emit: (...args: unknown[]) => unknown } };
};

type IncomingMessage = {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  obtrace?: { traceId: string; spanId: string };
};

type ServerResponse = {
  statusCode?: number;
  on?: (event: string, cb: () => void) => void;
};

type ClientRequest = {
  method?: string;
  path?: string;
  protocol?: string;
  host?: string;
  getHeader?: (name: string) => string | string[] | number | undefined;
  setHeader?: (name: string, value: string) => void;
  on?: (event: string, cb: (...args: unknown[]) => void) => ClientRequest;
};

let patched = false;

export function patchHTTP(client: ObtraceClient): void {
  if (patched) return;
  patched = true;

  let httpMod: HttpModule | null = null;
  let httpsMod: HttpModule | null = null;

  try {
    httpMod = require("http") as HttpModule;
  } catch {}
  try {
    httpsMod = require("https") as HttpModule;
  } catch {}

  if (httpMod) patchModule(httpMod, client, "http:");
  if (httpsMod) patchModule(httpsMod, client, "https:");
}

function patchModule(mod: HttpModule, client: ObtraceClient, protocol: string): void {
  if (mod.Server?.prototype) {
    const origEmit = mod.Server.prototype.emit;
    mod.Server.prototype.emit = function (...emitArgs: unknown[]) {
      const event = emitArgs[0] as string;
      if (event === "request" && emitArgs.length >= 3) {
        instrumentRequest(client, emitArgs[1] as IncomingMessage, emitArgs[2] as ServerResponse);
      }
      return (origEmit as Function).apply(this, emitArgs);
    };
  }

  const origRequest = mod.request as Function;
  mod.request = function (...args: unknown[]) {
    const options = normalizeRequestArgs(args);
    const traceId = randomHex(16);
    const spanId = randomHex(8);
    const startMs = Date.now();
    const startNs = nowUnixNano();

    if (options && typeof options === "object") {
      const opts = options as Record<string, unknown>;
      if (!opts.headers) opts.headers = {};
      const headers = opts.headers as Record<string, string>;
      if (!headers["traceparent"]) {
        headers["traceparent"] = createTraceparent(traceId, spanId);
      }
    }

    const req = origRequest.apply(this, args) as ClientRequest;

    const method = (req.method ?? "GET").toUpperCase();
    const host = req.host ?? "unknown";
    const path = req.path ?? "/";
    const url = `${protocol}//${host}${path}`;

    if (typeof req.on === "function") {
      req.on("response", (res: unknown) => {
        const incomingRes = res as { statusCode?: number; on?: (event: string, cb: () => void) => void };
        const finish = () => {
          const dur = Date.now() - startMs;
          const statusCode = incomingRes.statusCode ?? 0;
          client.span({
            name: `http.client ${method}`,
            traceId,
            spanId,
            startUnixNano: startNs,
            endUnixNano: nowUnixNano(),
            statusCode,
            attrs: {
              "http.method": method,
              "http.url": url,
              "http.status_code": statusCode,
              "http.duration_ms": dur,
            },
          });
          client.log(statusCode >= 400 ? "error" : "info", `outbound ${method} ${url} -> ${statusCode}`, {
            traceId,
            spanId,
            method,
            endpoint: url,
            statusCode,
            attrs: { duration_ms: dur },
          });
        };
        if (typeof incomingRes.on === "function") {
          incomingRes.on("end", finish);
        } else {
          finish();
        }
      });

      req.on("error", (err: unknown) => {
        const dur = Date.now() - startMs;
        client.span({
          name: `http.client ${method}`,
          traceId,
          spanId,
          startUnixNano: startNs,
          endUnixNano: nowUnixNano(),
          statusCode: 500,
          statusMessage: String(err),
          attrs: {
            "http.method": method,
            "http.url": url,
            "http.duration_ms": dur,
          },
        });
        client.log("error", `outbound ${method} ${url} failed: ${String(err)}`, {
          traceId,
          spanId,
          method,
          endpoint: url,
          attrs: { duration_ms: dur },
        });
      });
    }

    return req;
  };
}

function normalizeRequestArgs(args: unknown[]): unknown {
  if (typeof args[0] === "string") {
    try {
      return new URL(args[0]);
    } catch {
      return args[0];
    }
  }
  if (args[0] instanceof URL) {
    return args[0];
  }
  if (args[0] && typeof args[0] === "object") {
    return args[0];
  }
  return null;
}

function instrumentRequest(client: ObtraceClient, req: IncomingMessage, res: ServerResponse): void {
  if ((req as { _obtraceInstrumented?: boolean })._obtraceInstrumented) return;
  (req as { _obtraceInstrumented?: boolean })._obtraceInstrumented = true;

  const rawTraceparent = readHeader(req.headers, "traceparent");
  const parsed = parseTraceparent(rawTraceparent);
  const traceId = parsed?.traceId ?? randomHex(16);
  const spanId = randomHex(8);
  const startMs = Date.now();
  const startNs = nowUnixNano();

  req.obtrace = { traceId, spanId };

  const finish = () => {
    const statusCode = res.statusCode ?? 200;
    const method = req.method ?? "GET";
    const url = req.url ?? "/";
    const durationMs = Date.now() - startMs;

    client.log(statusCode >= 500 ? "error" : "info", `${method} ${url} ${statusCode}`, {
      traceId,
      spanId,
      method,
      endpoint: url,
      statusCode,
      attrs: { duration_ms: durationMs },
    });

    client.span({
      name: `http.request ${method}`,
      traceId,
      spanId,
      parentSpanId: parsed?.parentSpanId,
      startUnixNano: startNs,
      endUnixNano: nowUnixNano(),
      statusCode,
      attrs: {
        "http.method": method,
        "http.route": url,
        "http.status_code": statusCode,
        "http.duration_ms": durationMs,
      },
    });
  };

  if (typeof res.on === "function") {
    res.on("finish", finish);
  }
}

function readHeader(headers: Record<string, string | string[] | undefined> | undefined, name: string): string | null {
  if (!headers) return null;
  const v = headers[name] ?? headers[name.toLowerCase()];
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) return v[0] ?? null;
  return null;
}
