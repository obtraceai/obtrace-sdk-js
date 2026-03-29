import { initNodeSDK } from "../../src/node/index";
import { SemanticMetrics } from "../../src/shared/semantic_metrics";

const sdk = initNodeSDK({
  apiKey: "devkey",
  tenantId: "tenant-dev",
  projectId: "project-dev",
  appId: "api",
  env: "dev",
  serviceName: "example-api",
  debug: true
});

const res = await sdk.instrumentFetch("https://httpbin.org/status/204");
sdk.log("info", "node/bun sdk initialized", { statusCode: res.status });
sdk.metric(SemanticMetrics.runtimeCpuUtilization, 0.41, "1", { route: "/checkout" });
sdk.span({
  name: "checkout.charge",
  attrs: {
    "feature.name": "checkout",
    "payment.provider": "stripe"
  }
});

setTimeout(() => {
  void sdk.shutdown();
}, 1500);
