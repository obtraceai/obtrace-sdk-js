# Obtrace SDK Integration for Supabase

## 1) Environment Variables

Set in Supabase Edge Functions / project secrets:
- `OBTRACE_API_KEY`
- `OBTRACE_INGEST_BASE_URL`
- `OBTRACE_TENANT_ID`
- `OBTRACE_PROJECT_ID`
- `OBTRACE_ENV`

Set in frontend `.env`:
- `VITE_OBTRACE_API_KEY`
- `VITE_OBTRACE_INGEST_BASE_URL`
- `VITE_OBTRACE_TENANT_ID`
- `VITE_OBTRACE_PROJECT_ID`

Notes:
- Supabase Edge Functions run on Deno.
- Secrets are read via `Deno.env.get`.
- Reference: `https://supabase.com/docs/guides/functions/secrets`

## 2) Edge Function (Deno runtime)

```ts
import { ObtraceClient } from "@obtrace/sdk-js";

const obtrace = new ObtraceClient({
  apiKey: Deno.env.get("OBTRACE_API_KEY")!,
  ingestBaseUrl: Deno.env.get("OBTRACE_INGEST_BASE_URL")!,
  tenantId: Deno.env.get("OBTRACE_TENANT_ID") ?? undefined,
  projectId: Deno.env.get("OBTRACE_PROJECT_ID") ?? undefined,
  env: Deno.env.get("OBTRACE_ENV") ?? "production",
  appId: "supabase-edge",
  serviceName: "supabase-edge"
});

obtrace.log("info", "edge function started");
```

## 3) Frontend (Vite)

```ts
import { initViteBrowserSDK } from "@obtrace/sdk-js";

const sdk = initViteBrowserSDK({
  apiKey: import.meta.env.VITE_OBTRACE_API_KEY,
  ingestBaseUrl: import.meta.env.VITE_OBTRACE_INGEST_BASE_URL,
  tenantId: import.meta.env.VITE_OBTRACE_TENANT_ID,
  projectId: import.meta.env.VITE_OBTRACE_PROJECT_ID,
  appId: "supabase-web",
  serviceName: "supabase-web"
});
```

## 4) Production Hardening

1. Keep function key secret; never publish it in client env.
2. Use project-level keys and rotate periodically.
3. Validate logs and replay index after deploy.
