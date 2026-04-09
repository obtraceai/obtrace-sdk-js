import { trace, context as otelContext, SpanStatusCode, TraceFlags } from "@opentelemetry/api";
import { parseTraceparent } from "../../shared/utils";
import type { ObtraceClient } from "../../core/client";

export function honoObtraceMiddleware(client: ObtraceClient) {
  const tracer = client.getTracer();

  return async (c: { req: { method: string; path: string; header?: (name: string) => string | undefined } }, next: () => Promise<void>) => {
    let parentCtx = otelContext.active();
    const raw = c.req.header?.("traceparent");
    const parsed = parseTraceparent(raw ?? null);
    if (parsed) {
      parentCtx = trace.setSpanContext(parentCtx, {
        traceId: parsed.traceId,
        spanId: parsed.parentSpanId,
        traceFlags: TraceFlags.SAMPLED,
        isRemote: true,
      });
    }

    await tracer.startActiveSpan(`hono.request ${c.req.method}`, {
      attributes: {
        "http.method": c.req.method,
        "http.route": c.req.path,
      },
    }, parentCtx, async (span) => {
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
