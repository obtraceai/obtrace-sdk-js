import test from "node:test";
import assert from "node:assert/strict";

import { ObtraceClient } from "../src/core/client.ts";

test("constructor validates required fields", () => {
  assert.throws(() => new ObtraceClient({} as never), /apiKey and serviceName are required/);
});
