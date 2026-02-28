import type { ObtraceClient } from "../../core/client";
import { expressObtraceMiddleware } from "./express";

export function nestObtraceMiddleware(client: ObtraceClient) {
  return expressObtraceMiddleware(client);
}
