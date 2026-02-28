import type { ObtraceClient } from "../../core/client";
import { nowUnixNano, parseTraceparent, randomHex } from "../../shared/utils";

export function fastifyObtraceHook(client: ObtraceClient) {
  return async (request: { method: string; url: string; headers?: Record<string, string | string[] | undefined> }, reply: { statusCode: number }) => {
    const parsed = parseTraceparent(readHeader(request.headers, "traceparent"));
    const traceId = parsed?.traceId ?? randomHex(16);
    const spanId = randomHex(8);
    const startedMs = Date.now();
    const startedNs = nowUnixNano();

    client.log("info", `fastify ${request.method} ${request.url} ${reply.statusCode}`, {
      traceId,
      spanId,
      method: request.method,
      endpoint: request.url,
      statusCode: reply.statusCode,
      attrs: { duration_ms: Date.now() - startedMs }
    });
    client.span({
      name: `fastify.request ${request.method}`,
      traceId,
      spanId,
      parentSpanId: parsed?.parentSpanId,
      startUnixNano: startedNs,
      endUnixNano: nowUnixNano(),
      statusCode: reply.statusCode,
      attrs: {
        "http.method": request.method,
        "http.route": request.url,
        "http.status_code": reply.statusCode,
        "http.duration_ms": Date.now() - startedMs
      }
    });
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
