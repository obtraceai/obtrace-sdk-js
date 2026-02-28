import type { ObtraceClient } from "../../core/client";
import { nowUnixNano, parseTraceparent, randomHex } from "../../shared/utils";

export function expressObtraceMiddleware(client: ObtraceClient) {
  return (req: { method?: string; path?: string; headers?: Record<string, string | string[] | undefined>; obtrace?: unknown }, res: { statusCode?: number; on?: (ev: string, cb: () => void) => void }, next: () => void) => {
    const rawTraceparent = readHeader(req.headers, "traceparent");
    const parsed = parseTraceparent(rawTraceparent);
    const traceId = parsed?.traceId ?? randomHex(16);
    const spanId = randomHex(8);
    const startedMs = Date.now();
    const startedNs = nowUnixNano();
    req.obtrace = { traceId, spanId };

    const finish = () => {
      const statusCode = res.statusCode ?? 200;
      client.log("info", `${req.method ?? "GET"} ${req.path ?? "/"} ${res.statusCode ?? 200}`, {
        traceId,
        spanId,
        method: req.method,
        endpoint: req.path,
        statusCode,
        attrs: { duration_ms: Date.now() - startedMs }
      });
      client.span({
        name: `express.request ${req.method ?? "GET"}`,
        traceId,
        spanId,
        parentSpanId: parsed?.parentSpanId,
        startUnixNano: startedNs,
        endUnixNano: nowUnixNano(),
        statusCode,
        attrs: {
          "http.method": req.method ?? "GET",
          "http.route": req.path ?? "/",
          "http.status_code": statusCode,
          "http.duration_ms": Date.now() - startedMs
        }
      });
    };

    if (typeof res.on === "function") {
      res.on("finish", finish);
    }
    next();
  };
}

function readHeader(headers: Record<string, string | string[] | undefined> | undefined, name: string): string | null {
  if (!headers) {
    return null;
  }
  const v = headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];
  if (typeof v === "string") {
    return v;
  }
  if (Array.isArray(v) && v.length > 0) {
    return v[0] ?? null;
  }
  return null;
}
