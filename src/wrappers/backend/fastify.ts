import { trace, context as otelContext, SpanStatusCode, TraceFlags } from "@opentelemetry/api";
import { parseTraceparent } from "../../shared/utils";
import type { ObtraceClient } from "../../core/client";

export function fastifyObtraceHook(client: ObtraceClient) {
  const tracer = client.getTracer();

  return async (request: any, reply: any) => {
    const parsed = parseTraceparent(readHeader(request.headers, "traceparent"));

    let parentCtx = otelContext.active();
    if (parsed) {
      parentCtx = trace.setSpanContext(parentCtx, {
        traceId: parsed.traceId,
        spanId: parsed.parentSpanId,
        traceFlags: TraceFlags.SAMPLED,
        isRemote: true,
      });
    }

    const span = tracer.startSpan(`fastify.request ${request.method}`, {
      attributes: {
        "http.method": request.method,
        "http.route": request.url,
      },
    }, parentCtx);

    const spanCtx = span.spanContext();
    const startedMs = Date.now();

    const statusCode = reply.statusCode ?? 200;
    span.setAttribute("http.status_code", statusCode);
    if (statusCode >= 400) {
      span.setStatus({ code: SpanStatusCode.ERROR });
    } else {
      span.setStatus({ code: SpanStatusCode.OK });
    }
    span.end();

    client.log("info", `fastify ${request.method} ${request.url} ${statusCode}`, {
      traceId: spanCtx.traceId,
      spanId: spanCtx.spanId,
      method: request.method,
      endpoint: request.url,
      statusCode,
      attrs: { duration_ms: Date.now() - startedMs },
    });
  };
}

function readHeader(headers: any, name: string): string | null {
  if (!headers) return null;
  const v = headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) return v[0] ?? null;
  return null;
}
