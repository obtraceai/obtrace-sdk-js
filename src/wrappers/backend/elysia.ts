import type { ObtraceClient } from "../../core/client";
import { nowUnixNano, parseTraceparent, randomHex } from "../../shared/utils";

type ReqMeta = {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  method: string;
  path: string;
  startedMs: number;
  startedNs: string;
};

export function elysiaObtracePlugin(client: ObtraceClient) {
  const reqMap = new WeakMap<Request, ReqMeta>();

  return (app: any) => {
    if (!app || typeof app.onBeforeHandle !== "function" || typeof app.onAfterHandle !== "function") {
      return app;
    }

    app.onBeforeHandle((ctx: any) => {
      const req = ctx?.request as Request | undefined;
      if (!req) {
        return;
      }
      const parsed = parseTraceparent(req.headers.get("traceparent"));
      const method = req.method ?? "GET";
      const url = new URL(req.url);
      reqMap.set(req, {
        traceId: parsed?.traceId ?? randomHex(16),
        spanId: randomHex(8),
        parentSpanId: parsed?.parentSpanId,
        method,
        path: url.pathname,
        startedMs: Date.now(),
        startedNs: nowUnixNano()
      });
    });

    app.onAfterHandle((ctx: any) => {
      const req = ctx?.request as Request | undefined;
      if (!req) {
        return;
      }
      const meta = reqMap.get(req);
      if (!meta) {
        return;
      }

      const statusCode = Number(ctx?.set?.status ?? 200);
      const durationMs = Date.now() - meta.startedMs;
      client.log("info", `elysia ${meta.method} ${meta.path} ${statusCode}`, {
        traceId: meta.traceId,
        spanId: meta.spanId,
        method: meta.method,
        endpoint: meta.path,
        statusCode,
        attrs: { duration_ms: durationMs }
      });
      client.span({
        name: `elysia.request ${meta.method}`,
        traceId: meta.traceId,
        spanId: meta.spanId,
        parentSpanId: meta.parentSpanId,
        startUnixNano: meta.startedNs,
        endUnixNano: nowUnixNano(),
        statusCode,
        attrs: {
          "http.method": meta.method,
          "http.route": meta.path,
          "http.status_code": statusCode,
          "http.duration_ms": durationMs
        }
      });
    });

    if (typeof app.onError === "function") {
      app.onError((ctx: any) => {
        const req = ctx?.request as Request | undefined;
        if (!req) {
          return;
        }
        const meta = reqMap.get(req);
        if (!meta) {
          return;
        }
        client.log("error", `elysia error: ${String(ctx?.error ?? "unknown")}`, {
          traceId: meta.traceId,
          spanId: meta.spanId,
          method: meta.method,
          endpoint: meta.path
        });
      });
    }

    return app;
  };
}
