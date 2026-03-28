import { ObtraceClient } from "../core/client";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import type { LogLevel, ObtraceSDKConfig, SDKContext } from "../shared/types";

export interface NodeSDK {
  client: ObtraceClient;
  log: (level: LogLevel, message: string, context?: SDKContext) => void;
  captureError: (error: unknown, context?: SDKContext) => void;
  metric: (name: string, value: number, unit?: string, context?: SDKContext) => void;
  instrumentFetch: typeof globalThis.fetch;
  shutdown: () => Promise<void>;
}

export function initNodeSDK(config: ObtraceSDKConfig): NodeSDK {
  const client = new ObtraceClient(config);

  const log = (level: LogLevel, message: string, ctx?: SDKContext) => {
    client.log(level, message, ctx);
  };

  const captureError = (error: unknown, ctx?: SDKContext) => {
    const msg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    client.log("error", msg, ctx);

    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      activeSpan.setStatus({ code: SpanStatusCode.ERROR, message: msg });
      if (error instanceof Error) {
        activeSpan.recordException(error);
      }
    }
  };

  installUnhandledHooks(client);

  return {
    client,
    log,
    captureError,
    metric: client.metric.bind(client),
    instrumentFetch: globalThis.fetch,
    shutdown: client.shutdown.bind(client),
  };
}

let hooksInstalled = false;

function installUnhandledHooks(client: ObtraceClient): void {
  if (hooksInstalled) return;
  hooksInstalled = true;

  const proc = (globalThis as {
    process?: {
      on: (event: string, cb: (arg: unknown) => void) => void;
    };
  }).process;
  if (!proc) return;

  proc.on("uncaughtException", (err: unknown) => {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    client.log("fatal", `uncaughtException: ${msg}`);
  });

  proc.on("unhandledRejection", (reason: unknown) => {
    const msg = reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason);
    client.log("error", `unhandledRejection: ${msg}`);
  });
}
