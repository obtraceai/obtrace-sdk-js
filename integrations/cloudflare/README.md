# Obtrace SDK Integration for Cloudflare Workers

## Environment Variables

Set as Cloudflare Worker secrets/vars:
- `OBTRACE_API_KEY`
- `OBTRACE_INGEST_BASE_URL`
- `OBTRACE_TENANT_ID`
- `OBTRACE_PROJECT_ID`
- `OBTRACE_ENV`

## Worker Example

```ts
import { ObtraceClient } from "@obtrace/sdk-js";

export default {
  async fetch(request: Request, env: Record<string, string>): Promise<Response> {
    const obtrace = new ObtraceClient({
      apiKey: env.OBTRACE_API_KEY,
      ingestBaseUrl: env.OBTRACE_INGEST_BASE_URL,
      tenantId: env.OBTRACE_TENANT_ID,
      projectId: env.OBTRACE_PROJECT_ID,
      env: env.OBTRACE_ENV ?? "production",
      appId: "cf-worker",
      serviceName: "cf-worker"
    });
    obtrace.log("info", "worker request", { method: request.method });
    await obtrace.flush();
    return new Response("ok");
  }
};
```
