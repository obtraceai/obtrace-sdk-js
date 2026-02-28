import { initNodeSDK } from "../../src/node/index";
import { nestObtraceMiddleware } from "../../src/wrappers/backend/nest";

const sdk = initNodeSDK({
  apiKey: process.env.OBTRACE_API_KEY ?? "devkey",
  ingestBaseUrl: process.env.OBTRACE_INGEST_BASE_URL ?? "https://inject.obtrace.ai",
  serviceName: "nestjs-api"
});

export const obtraceNestMiddleware = nestObtraceMiddleware(sdk.client);
