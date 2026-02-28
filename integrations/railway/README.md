# Obtrace SDK Integration for Railway (Backend)

## Environment Variables

- `OBTRACE_API_KEY`
- `OBTRACE_INGEST_BASE_URL`
- `OBTRACE_TENANT_ID`
- `OBTRACE_PROJECT_ID`
- `OBTRACE_ENV`

## Node/Bun initialization

```ts
import { initNodeSDK } from "@obtrace/sdk-js/node";

const obtrace = initNodeSDK({
  apiKey: process.env.OBTRACE_API_KEY!,
  ingestBaseUrl: process.env.OBTRACE_INGEST_BASE_URL!,
  tenantId: process.env.OBTRACE_TENANT_ID,
  projectId: process.env.OBTRACE_PROJECT_ID,
  env: process.env.OBTRACE_ENV,
  appId: "railway-api",
  serviceName: "railway-api"
});

export default obtrace;
```
