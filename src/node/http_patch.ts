import type { ObtraceClient } from "../core/client";
import { nowUnixNano, parseTraceparent, randomHex } from "../shared/utils";

type HttpModule = {
  createServer: (...args: unknown[]) => unknown;
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

  if (httpMod) patchModule(httpMod, client);
  if (httpsMod) patchModule(httpsMod, client);
}

function patchModule(mod: HttpModule, client: ObtraceClient): void {
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
}

function wrapRequestListener(client: ObtraceClient, listener: (...args: unknown[]) => void) {
  return (req: IncomingMessage, res: ServerResponse, ...rest: unknown[]) => {
    instrumentRequest(client, req, res);
    return listener(req, res, ...rest);
  };
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
