import test from "node:test";
import assert from "node:assert/strict";

import { parseTraceparent, createTraceparent } from "../src/shared/utils.ts";

test("parseTraceparent extracts W3C fields", () => {
  const result = parseTraceparent("00-abcdef1234567890abcdef1234567890-1234567890abcdef-01");
  assert.ok(result);
  assert.equal(result.traceId, "abcdef1234567890abcdef1234567890");
  assert.equal(result.parentSpanId, "1234567890abcdef");
  assert.equal(result.flags, "01");
});

test("parseTraceparent returns null for invalid input", () => {
  assert.equal(parseTraceparent(null), null);
  assert.equal(parseTraceparent(undefined), null);
  assert.equal(parseTraceparent(""), null);
  assert.equal(parseTraceparent("invalid"), null);
  assert.equal(parseTraceparent("00-short-id-01"), null);
});

test("createTraceparent generates valid W3C format", () => {
  const tp = createTraceparent("abcdef1234567890abcdef1234567890", "1234567890abcdef");
  assert.equal(tp, "00-abcdef1234567890abcdef1234567890-1234567890abcdef-01");
});

test("createTraceparent generates random IDs when not provided", () => {
  const tp = createTraceparent();
  const parts = tp.split("-");
  assert.equal(parts.length, 4);
  assert.equal(parts[0], "00");
  assert.equal(parts[1].length, 32);
  assert.equal(parts[2].length, 16);
  assert.equal(parts[3], "01");
});

test("span() with traceId and parentSpanId creates child span", async () => {
  const { ObtraceClient } = await import("../src/core/client.ts");

  const client = new ObtraceClient({
    apiKey: "test-key",
    serviceName: "test-svc",
    ingestBaseUrl: "http://127.0.0.1:19999",
  });

  const parentTraceId = "abcdef1234567890abcdef1234567890";
  const parentSpanId = "1234567890abcdef";

  const result = client.span({
    name: "child-operation",
    traceId: parentTraceId,
    parentSpanId: parentSpanId,
    attrs: { "http.method": "GET" },
  });

  assert.equal(result.traceId, parentTraceId, "child span must inherit parent traceId");
  assert.ok(result.spanId.length === 16, "child span must have valid spanId");
  assert.notEqual(result.spanId, parentSpanId, "child span must have its own spanId");

  try { await client.shutdown(); } catch {}
});

test("span() without traceId generates new trace", async () => {
  const { ObtraceClient } = await import("../src/core/client.ts");

  const client = new ObtraceClient({
    apiKey: "test-key",
    serviceName: "test-svc",
    ingestBaseUrl: "http://127.0.0.1:19999",
  });

  const result = client.span({
    name: "root-operation",
    attrs: { "http.method": "POST" },
  });

  assert.ok(result.traceId.length === 32, "must generate valid traceId");
  assert.ok(result.spanId.length === 16, "must generate valid spanId");

  try { await client.shutdown(); } catch {}
});
