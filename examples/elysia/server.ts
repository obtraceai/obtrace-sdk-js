import { Elysia } from "elysia";
import { initNodeSDK } from "../../src/node";
import { elysiaObtracePlugin } from "../../src/wrappers/backend/elysia";

const sdk = initNodeSDK({
  apiKey: process.env.OBTRACE_API_KEY ?? "devkey",
  ingestBaseUrl: process.env.OBTRACE_INGEST_BASE_URL ?? "https://inject.obtrace.ai",
  tenantId: process.env.OBTRACE_TENANT_ID ?? "tenant-dev",
  projectId: process.env.OBTRACE_PROJECT_ID ?? "project-dev",
  env: process.env.OBTRACE_ENV ?? "dev",
  appId: "elysia-api",
  serviceName: "elysia-api"
});

const app = new Elysia();
elysiaObtracePlugin(sdk.client)(app);

app.get("/health", () => "ok");

app.listen(3000);
sdk.log("info", "elysia server started");
