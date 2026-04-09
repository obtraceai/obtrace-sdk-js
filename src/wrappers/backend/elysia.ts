import { trace, context as otelContext, SpanStatusCode, TraceFlags } from "@opentelemetry/api";
import { parseTraceparent } from "../../shared/utils";
import type { ObtraceClient } from "../../core/client";

export function elysiaObtracePlugin(client: ObtraceClient) {
  const tracer = client.getTracer();

  return (app: any) => {
    if (!app || typeof app.onBeforeHandle !== "function" || typeof app.onAfterHandle !== "function") {
      return app;
    }

    const spanMap = new WeakMap<Request, ReturnType<typeof tracer.startSpan>>();

    app.onBeforeHandle((ctx: any) => {
      const req = ctx?.request as Request | undefined;
      if (!req) return;

      const method = req.method ?? "GET";
      const url = new URL(req.url);

      let parentCtx = otelContext.active();
      const raw = req.headers.get("traceparent");
      const parsed = parseTraceparent(raw);
      if (parsed) {
        parentCtx = trace.setSpanContext(parentCtx, {
          traceId: parsed.traceId,
          spanId: parsed.parentSpanId,
          traceFlags: TraceFlags.SAMPLED,
          isRemote: true,
        });
      }

      const span = tracer.startSpan(`elysia.request ${method}`, {
        attributes: {
          "http.method": method,
          "http.route": url.pathname,
        },
      }, parentCtx);
      spanMap.set(req, span);
    });

    app.onAfterHandle((ctx: any) => {
      const req = ctx?.request as Request | undefined;
      if (!req) return;

      const span = spanMap.get(req);
      if (!span) return;

      const statusCode = Number(ctx?.set?.status ?? 200);
      span.setAttribute("http.status_code", statusCode);
      if (statusCode >= 400) {
        span.setStatus({ code: SpanStatusCode.ERROR });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }
      span.end();
    });

    if (typeof app.onError === "function") {
      app.onError((ctx: any) => {
        const req = ctx?.request as Request | undefined;
        if (!req) return;

        const span = spanMap.get(req);
        if (!span) return;

        span.setStatus({ code: SpanStatusCode.ERROR, message: String(ctx?.error ?? "unknown") });
        if (ctx?.error instanceof Error) span.recordException(ctx.error);
        span.end();
      });
    }

    return app;
  };
}
