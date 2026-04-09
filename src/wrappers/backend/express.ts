import { trace, context as otelContext, SpanStatusCode, TraceFlags } from "@opentelemetry/api";
import { nowUnixNano, parseTraceparent } from "../../shared/utils";
import type { ObtraceClient } from "../../core/client";

export function expressObtraceMiddleware(client: ObtraceClient) {
  const tracer = client.getTracer();

  return (req: any, res: any, next: () => void) => {
    const rawTraceparent = readHeader(req.headers, "traceparent");
    const parsed = parseTraceparent(rawTraceparent);

    let parentCtx = otelContext.active();
    if (parsed) {
      parentCtx = trace.setSpanContext(parentCtx, {
        traceId: parsed.traceId,
        spanId: parsed.parentSpanId,
        traceFlags: TraceFlags.SAMPLED,
        isRemote: true,
      });
    }

    const span = tracer.startSpan(`express.request ${req.method ?? "GET"}`, {
      attributes: {
        "http.method": req.method ?? "GET",
        "http.route": req.path ?? "/",
      },
    }, parentCtx);

    const spanCtx = span.spanContext();
    req.obtrace = { traceId: spanCtx.traceId, spanId: spanCtx.spanId };

    const finish = () => {
      const statusCode = res.statusCode ?? 200;
      span.setAttribute("http.status_code", statusCode);
      if (statusCode >= 400) {
        span.setStatus({ code: SpanStatusCode.ERROR });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }
      span.end();

      client.log("info", `${req.method ?? "GET"} ${req.path ?? "/"} ${statusCode}`, {
        traceId: spanCtx.traceId,
        spanId: spanCtx.spanId,
        method: req.method,
        endpoint: req.path,
        statusCode,
        attrs: { duration_ms: Date.now() - startedMs },
      });
    };

    const startedMs = Date.now();
    if (typeof res.on === "function") {
      res.on("finish", finish);
    }
    next();
  };
}

function readHeader(headers: any, name: string): string | null {
  if (!headers) return null;
  const v = headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) return v[0] ?? null;
  return null;
}
