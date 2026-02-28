import express from "express";
import { initNodeSDK } from "../../src/node/index";
import { expressObtraceMiddleware } from "../../src/wrappers/backend/express";

const sdk = initNodeSDK({
  apiKey: process.env.OBTRACE_API_KEY ?? "devkey",
  ingestBaseUrl: process.env.OBTRACE_INGEST_BASE_URL ?? "https://inject.obtrace.ai",
  serviceName: "express-api"
});

const app = express();
app.use(expressObtraceMiddleware(sdk.client) as unknown as express.RequestHandler);

app.get("/health", (_req, res) => {
  sdk.log("info", "health endpoint called");
  res.json({ ok: true });
});

app.listen(3010, () => {
  sdk.log("info", "express server started");
});
