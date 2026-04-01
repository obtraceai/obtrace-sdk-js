import { initNodeSDK, type NodeSDK } from "../node/index";
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

const apiKey = readDenoEnv("OBTRACE_API_KEY");
if (apiKey) {
  initSupabaseSDK();
}
