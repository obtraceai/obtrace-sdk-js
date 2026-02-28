import { initNodeSDK } from "../../src/node/index";

const sdk = initNodeSDK({
  apiKey: "devkey",
  ingestBaseUrl: "https://injet.obtrace.ai",
  tenantId: "tenant-dev",
  projectId: "project-dev",
  appId: "api",
  env: "dev",
  serviceName: "example-api",
  debug: true
});

const res = await sdk.instrumentFetch("https://httpbin.org/status/204");
sdk.log("info", "node/bun sdk initialized", { statusCode: res.status });

setTimeout(() => {
  void sdk.shutdown();
}, 1500);
