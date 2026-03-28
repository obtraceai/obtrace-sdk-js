import { trace, SpanStatusCode, type Tracer } from "@opentelemetry/api";
import type { ObtraceClient } from "../../core/client";

export function honoObtraceMiddleware(client: ObtraceClient) {
  const tracer = client.getTracer();

  return async (c: { req: { method: string; path: string; header?: (name: string) => string | undefined } }, next: () => Promise<void>) => {
    await tracer.startActiveSpan(`hono.request ${c.req.method}`, {
      attributes: {
        "http.method": c.req.method,
        "http.route": c.req.path,
      },
    }, async (span) => {
      try {
        await next();
        span.setStatus({ code: SpanStatusCode.OK });
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
        if (err instanceof Error) span.recordException(err);
        throw err;
      } finally {
        span.end();
      }
    });
  };
}
