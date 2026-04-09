import { initNodeSDK, type NodeSDK } from "../node/index";
import { trace, context as otelContext, SpanStatusCode, TraceFlags } from "@opentelemetry/api";
import { parseTraceparent } from "../shared/utils";
import type { ObtraceSDKConfig } from "../shared/types";

declare const Deno: {
  env: { get(key: string): string | undefined };
};

function readDenoEnv(key: string): string | undefined {
  try {
    return typeof Deno !== "undefined" ? Deno.env.get(key) : undefined;
  } catch {
    return undefined;
  }
}

export function initSupabaseSDK(config?: Partial<ObtraceSDKConfig>): NodeSDK {
  const apiKey = config?.apiKey || readDenoEnv("OBTRACE_API_KEY") || "";
  const serviceName = config?.serviceName || readDenoEnv("OBTRACE_SERVICE_NAME") || "edge-function";

  return initNodeSDK({
    ...config,
    apiKey,
    serviceName,
  });
}

export type EdgeHandler = (req: Request) => Response | Promise<Response>;

export function withEdgeFunctionTrace(sdk: NodeSDK, handler: EdgeHandler): EdgeHandler {
  const tracer = sdk.client.getTracer();

  return async (req: Request) => {
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

    const method = req.method;
    const pathname = new URL(req.url).pathname;

    return tracer.startActiveSpan(`edge-function ${method} ${pathname}`, {
      attributes: {
        "http.method": method,
        "http.route": pathname,
        "faas.trigger": "http",
      },
    }, parentCtx, async (span) => {
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
  };
}

const apiKey = readDenoEnv("OBTRACE_API_KEY");
if (apiKey) {
  initSupabaseSDK();
}
