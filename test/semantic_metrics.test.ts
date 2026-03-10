import test from "node:test";
import assert from "node:assert/strict";
import { SemanticMetrics, isSemanticMetricName } from "../src/index.ts";

test("semantic metrics exports canonical names", () => {
  assert.equal(SemanticMetrics.runtimeCpuUtilization, "runtime.cpu.utilization");
  assert.equal(SemanticMetrics.dbOperationLatency, "db.operation.latency");
  assert.equal(SemanticMetrics.webVitalInp, "web.vital.inp");
  assert.equal(isSemanticMetricName(SemanticMetrics.webVitalInp), true);
  assert.equal(isSemanticMetricName("orders.count"), false);
});
