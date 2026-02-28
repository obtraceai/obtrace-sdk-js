# Obtrace SDK Integration for Vercel

## 1) Environment Variables

Set in Vercel project settings:
- `OBTRACE_API_KEY`
- `OBTRACE_INGEST_BASE_URL`
- `OBTRACE_TENANT_ID`
- `OBTRACE_PROJECT_ID`
- `OBTRACE_ENV`

For browser apps also set:
- `NEXT_PUBLIC_OBTRACE_API_KEY`
- `NEXT_PUBLIC_OBTRACE_INGEST_BASE_URL`
- `NEXT_PUBLIC_OBTRACE_TENANT_ID`
- `NEXT_PUBLIC_OBTRACE_PROJECT_ID`

See `.env.example` in this folder.

Notes:
- Server-only secrets must stay unprefixed.
- Client-exposed values must use `NEXT_PUBLIC_`.
- References: `https://vercel.com/docs/environment-variables`, `https://nextjs.org/docs/app/guides/environment-variables`

## 2) Next.js App Router (Node.js runtime)

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

## 3) Next.js Client (browser)

```ts
import { initBrowserSDK } from "@obtrace/sdk-js/browser";

export const obtraceBrowser = initBrowserSDK({
  apiKey: process.env.NEXT_PUBLIC_OBTRACE_API_KEY!,
  ingestBaseUrl: process.env.NEXT_PUBLIC_OBTRACE_INGEST_BASE_URL!,
  tenantId: process.env.NEXT_PUBLIC_OBTRACE_TENANT_ID,
  projectId: process.env.NEXT_PUBLIC_OBTRACE_PROJECT_ID,
  env: process.env.NODE_ENV,
  appId: "vercel-web",
  serviceName: "vercel-web"
});
```

## 4) Edge Runtime Consideration

For Next.js Edge runtime handlers, prefer `ObtraceClient` from `@obtrace/sdk-js` (core client) instead of `@obtrace/sdk-js/node`.

## 5) Production Hardening

1. Do not expose backend API key to client bundles.
2. Use separate API keys per environment.
3. Restrict ingest origin allowlist by project/env.
4. Validate telemetry arrival in Query Gateway after each deploy.
