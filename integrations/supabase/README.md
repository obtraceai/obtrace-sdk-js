# Obtrace SDK Integration for Supabase (Edge Functions)

## Environment Variables

Set in Supabase Edge Functions / project secrets:
- `OBTRACE_API_KEY`
- `OBTRACE_INGEST_BASE_URL`
- `OBTRACE_TENANT_ID`
- `OBTRACE_PROJECT_ID`
- `OBTRACE_ENV`

## Edge Function (Deno runtime)

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
