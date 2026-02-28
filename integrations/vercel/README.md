# Obtrace SDK Integration for Vercel (Backend)

## Environment Variables

Set in Vercel project settings:
- `OBTRACE_API_KEY`
- `OBTRACE_INGEST_BASE_URL`
- `OBTRACE_TENANT_ID`
- `OBTRACE_PROJECT_ID`
- `OBTRACE_ENV`

## Next.js App Router (Node.js runtime)

```ts
import { initNodeSDK } from "@obtrace/sdk-js/node";

export const obtrace = initNodeSDK({
  apiKey: process.env.OBTRACE_API_KEY!,
  ingestBaseUrl: process.env.OBTRACE_INGEST_BASE_URL!,
  tenantId: process.env.OBTRACE_TENANT_ID,
  projectId: process.env.OBTRACE_PROJECT_ID,
  env: process.env.OBTRACE_ENV,
  appId: "vercel-api",
  serviceName: "vercel-api"
});
```
