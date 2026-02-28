import { initNodeSDK } from "../../src/node/index";
import { withNextRouteHandler } from "../../src/wrappers/backend/next";

const sdk = initNodeSDK({
  apiKey: process.env.OBTRACE_API_KEY ?? "devkey",
  ingestBaseUrl: process.env.OBTRACE_INGEST_BASE_URL ?? "https://inject.obtrace.ai",
  serviceName: "next-app"
});

export const GET = withNextRouteHandler(sdk.client, async (_req: Request) => {
  sdk.log("info", "next route called");
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
});
