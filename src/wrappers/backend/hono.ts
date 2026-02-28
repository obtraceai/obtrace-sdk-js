import type { ObtraceClient } from "../../core/client";
import { nowUnixNano, parseTraceparent, randomHex } from "../../shared/utils";

export function honoObtraceMiddleware(client: ObtraceClient) {
  return async (c: { req: { method: string; path: string; header?: (name: string) => string | undefined } }, next: () => Promise<void>) => {
    const parsed = parseTraceparent(c.req.header?.("traceparent"));
    const traceId = parsed?.traceId ?? randomHex(16);
    const spanId = randomHex(8);
    const startedMs = Date.now();
    const startedNs = nowUnixNano();
    await next();
    client.log("info", `hono ${c.req.method} ${c.req.path}`, {
      traceId,
      spanId,
      method: c.req.method,
      endpoint: c.req.path,
      attrs: { duration_ms: Date.now() - startedMs }
    });
    client.span({
      name: `hono.request ${c.req.method}`,
      traceId,
      spanId,
      parentSpanId: parsed?.parentSpanId,
      startUnixNano: startedNs,
      endUnixNano: nowUnixNano(),
      attrs: {
        "http.method": c.req.method,
        "http.route": c.req.path,
        "http.duration_ms": Date.now() - startedMs
      }
    });
  };
}
