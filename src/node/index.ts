import { ObtraceClient } from "../core/client";
import type { LogLevel, ObtraceSDKConfig, SDKContext } from "../shared/types";
import { instrumentServerFetch } from "./server_fetch";

export interface NodeSDK {
  client: ObtraceClient;
  log: (level: LogLevel, message: string, context?: SDKContext) => void;
  captureError: (error: unknown, context?: SDKContext) => void;
  metric: (name: string, value: number, unit?: string, context?: SDKContext) => void;
  instrumentFetch: typeof globalThis.fetch;
  shutdown: () => Promise<void>;
}

export function initNodeSDK(config: ObtraceSDKConfig): NodeSDK {
  const runtime = typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" ? "bun" : "node";

  const client = new ObtraceClient({
    ...config,
    propagation: {
      enabled: true,
      ...config.propagation
    },
    defaultHeaders: {
      "x-obtrace-runtime": runtime,
      ...(config.defaultHeaders ?? {})
    }
  });

  const log = (level: LogLevel, message: string, context?: SDKContext) => {
    client.log(level, message, context);
  };

  const captureError = (error: unknown, context?: SDKContext) => {
    const msg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    client.log("error", msg, context);
  };

  installUnhandledHooks(client);
  const instrumented = instrumentServerFetch(client);

  return {
    client,
    log,
    captureError,
    metric: client.metric.bind(client),
    instrumentFetch: instrumented,
    shutdown: client.shutdown.bind(client)
  };
}

function installUnhandledHooks(client: ObtraceClient): void {
  const proc = (globalThis as {
    process?: {
      on: (event: string, cb: (arg: unknown) => void) => void;
    };
  }).process;
  if (!proc) {
    return;
  }

  proc.on("uncaughtException", (err: unknown) => {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    client.log("fatal", `uncaughtException: ${msg}`);
  });

  proc.on("unhandledRejection", (reason: unknown) => {
    const msg = reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason);
    client.log("error", `unhandledRejection: ${msg}`);
  });
}
