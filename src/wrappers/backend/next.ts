import type { ObtraceClient } from "../../core/client";
import { nowUnixNano, parseTraceparent, randomHex } from "../../shared/utils";

export function withNextRouteHandler<T extends (req: Request) => Promise<Response> | Response>(client: ObtraceClient, handler: T): T {
  const wrapped = (async (req: Request) => {
    const parsed = parseTraceparent(req.headers.get("traceparent"));
    const traceId = parsed?.traceId ?? randomHex(16);
    const spanId = randomHex(8);
    const startedMs = Date.now();
    const startedNs = nowUnixNano();
    try {
      const res = await handler(req);
      client.log("info", `next ${req.method} ${new URL(req.url).pathname} ${res.status}`, {
        traceId,
        spanId,
        method: req.method,
        endpoint: new URL(req.url).pathname,
        statusCode: res.status,
        attrs: { duration_ms: Date.now() - startedMs }
      });
      client.span({
        name: `next.request ${req.method}`,
        traceId,
        spanId,
        parentSpanId: parsed?.parentSpanId,
        startUnixNano: startedNs,
        endUnixNano: nowUnixNano(),
        statusCode: res.status,
        attrs: {
          "http.method": req.method,
          "http.route": new URL(req.url).pathname,
          "http.status_code": res.status,
          "http.duration_ms": Date.now() - startedMs
        }
      });
      return res;
    } catch (err) {
      client.log("error", `next handler failed: ${String(err)}`, {
        traceId,
        spanId,
        method: req.method,
        endpoint: new URL(req.url).pathname,
        attrs: { duration_ms: Date.now() - startedMs }
      });
      client.span({
        name: `next.request ${req.method}`,
        traceId,
        spanId,
        parentSpanId: parsed?.parentSpanId,
        startUnixNano: startedNs,
        endUnixNano: nowUnixNano(),
        statusCode: 500,
        statusMessage: String(err),
        attrs: {
          "http.method": req.method,
          "http.route": new URL(req.url).pathname,
          "http.duration_ms": Date.now() - startedMs
        }
      });
      throw err;
    }
  }) as T;

  return wrapped;
}
