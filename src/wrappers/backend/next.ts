import { SpanStatusCode } from "@opentelemetry/api";
import type { ObtraceClient } from "../../core/client";

export function withNextRouteHandler<T extends (req: Request) => Promise<Response> | Response>(client: ObtraceClient, handler: T): T {
  const tracer = client.getTracer();

  const wrapped = (async (req: Request) => {
    const method = req.method;
    const pathname = new URL(req.url).pathname;

    return tracer.startActiveSpan(`next.request ${method}`, {
      attributes: {
        "http.method": method,
        "http.route": pathname,
      },
    }, async (span) => {
      try {
        const res = await handler(req);
        span.setAttribute("http.status_code", res.status);
        if (res.status >= 400) {
          span.setStatus({ code: SpanStatusCode.ERROR });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }
        span.end();
        return res;
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
        if (err instanceof Error) span.recordException(err);
        span.end();
        throw err;
      }
    });
  }) as T;

  return wrapped;
}
