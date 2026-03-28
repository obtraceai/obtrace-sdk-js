import { ObtraceClient } from "../core/client";
import type { LogLevel, ObtraceSDKConfig, SDKContext } from "../shared/types";
import { patchHTTP } from "./http_patch";
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
  if (config.patchConsole !== false) {
    installConsoleHooks(client);
  }
  patchHTTP(client);
  const instrumented = instrumentServerFetch(client);
  globalThis.fetch = instrumented;

  return {
    client,
    log,
    captureError,
    metric: client.metric.bind(client),
    instrumentFetch: instrumented,
    shutdown: client.shutdown.bind(client)
  };
}

let consoleHooked = false;

function installConsoleHooks(client: ObtraceClient): void {
  if (consoleHooked) return;
  consoleHooked = true;

  const mapping: [keyof Console, LogLevel][] = [
    ["debug", "debug"],
    ["log", "info"],
    ["info", "info"],
    ["warn", "warn"],
    ["error", "error"],
  ];

  for (const [method, level] of mapping) {
    const original = console[method] as (...args: unknown[]) => void;
    (console as unknown as Record<string, unknown>)[method] = (...args: unknown[]) => {
      original.apply(console, args);
      if (!args.length) return;
      const first = args[0];
      if (first !== null && typeof first === "object" && !Array.isArray(first) && !(first instanceof Error)) {
        const structuredAttrs: Record<string, string | number | boolean> = {};
        for (const [k, v] of Object.entries(first as Record<string, unknown>)) {
          if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
            structuredAttrs[k] = v;
          } else if (v !== undefined && v !== null) {
            structuredAttrs[k] = String(v);
          }
        }
        const msg = typeof (first as Record<string, unknown>).msg === "string"
          ? (first as Record<string, unknown>).msg as string
          : typeof (first as Record<string, unknown>).message === "string"
            ? (first as Record<string, unknown>).message as string
            : JSON.stringify(first);
        if (!msg.startsWith("[obtrace]")) {
          client.log(level, msg, { attrs: structuredAttrs });
        }
        return;
      }
      const parts: string[] = [];
      for (const a of args) {
        if (typeof a === "string") {
          parts.push(a);
        } else {
          parts.push(JSON.stringify(a));
        }
      }
      const message = parts.join(" ");
      if (message && !message.startsWith("[obtrace]")) {
        client.log(level, message);
      }
    };
  }
}

let hooksInstalled = false;

function installUnhandledHooks(client: ObtraceClient): void {
  if (hooksInstalled) {
    return;
  }
  hooksInstalled = true;
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
