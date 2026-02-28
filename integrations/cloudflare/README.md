# Obtrace SDK Integration for Cloudflare

## 1) Environment Variables

Set as Cloudflare Worker secrets/vars:
- `OBTRACE_API_KEY`
- `OBTRACE_INGEST_BASE_URL`
- `OBTRACE_TENANT_ID`
- `OBTRACE_PROJECT_ID`
- `OBTRACE_ENV`

For frontend apps hosted on Pages:
- `VITE_OBTRACE_API_KEY`
- `VITE_OBTRACE_INGEST_BASE_URL`
- `VITE_OBTRACE_TENANT_ID`
- `VITE_OBTRACE_PROJECT_ID`

Notes:
- Cloudflare Workers use bindings (`vars` and secrets), not `.env` at runtime.
- References:
  - `https://developers.cloudflare.com/workers/configuration/environment-variables/`
  - `https://developers.cloudflare.com/workers/configuration/secrets/`

## 2) Worker Example

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

## 3) Production Hardening

1. Keep server key only in Worker secret store.
2. Bind different keys by environment (`preview`, `production`).
3. Validate ingest connectivity from edge regions.
