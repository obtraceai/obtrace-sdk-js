# obtrace-sdk-js

JavaScript SDK suite for Obtrace.

## Summary
- Runtimes: browser, node, bun
- Frontend wrappers: Vite, React, Next, Vue, Angular, Svelte
- Backend wrappers: Express, Fastify, Hono, Elysia, NestJS, Next route handlers
- Exports: `@obtrace/sdk-js/browser`, `@obtrace/sdk-js/node`, `@obtrace/sdk-js`

## Scope
- Browser SDK
- Node.js/Bun SDK
- Frontend wrappers (Vite, React, Next, Vue, Angular, Svelte)
- Backend wrappers (Express, Fastify, Hono, Elysia, NestJS, Next route handlers)

## Design Principle
This SDK is intentionally thin/dumb.
- SDK handles capture, propagation, buffering, transport.
- Business logic and policy authority stays in backend/ingest/control-plane.

## Install

```bash
npm install @obtrace/sdk-js
# or
bun add @obtrace/sdk-js
```

## Configuration

Required:
- `apiKey`
- `ingestBaseUrl`
- `serviceName`

Recommended:
- `tenantId`
- `projectId`
- `appId`
- `env`
- `serviceVersion`
- `replay`, `vitals`, `propagation` options according to app profile

## Browser Quickstart

```ts
import { initBrowserSDK } from "@obtrace/sdk-js/browser";

const sdk = initBrowserSDK({
  apiKey: "<API_KEY>",
  ingestBaseUrl: "https://injet.obtrace.ai",
  serviceName: "web-app",
  tenantId: "tenant-prod",
  projectId: "project-prod",
  appId: "web",
  env: "prod",
  replay: { enabled: true, captureNetworkRecipes: true },
  vitals: { enabled: true },
  propagation: { enabled: true }
});
```

## Node/Bun Quickstart

```ts
import { initNodeSDK } from "@obtrace/sdk-js/node";

const sdk = initNodeSDK({
  apiKey: process.env.OBTRACE_API_KEY!,
  ingestBaseUrl: process.env.OBTRACE_INGEST_BASE_URL!,
  serviceName: "api-service",
  env: "prod"
});

sdk.log("info", "service started");
await sdk.shutdown();
```

## Wrapper Quickstart

```ts
import {
  initViteBrowserSDK,
  createViteConfigFromImportMetaEnv,
  createReactObtrace,
  createVueObtrace,
  initNextBrowserSDK,
  expressObtraceMiddleware,
  elysiaObtracePlugin,
  nestObtraceMiddleware,
  withNextRouteHandler
} from "@obtrace/sdk-js";
```

## Production Hardening

1. Never leak server API keys to browser bundles.
2. Use separate keys by environment and rotate regularly.
3. Keep replay/network capture controls aligned with privacy policy.
4. Validate logs/traces/replay paths after deployment.

## Troubleshooting

- Browser data missing: validate CORS and client env variables.
- Node/Bun data missing: check server env vars and egress to ingest.
- Broken trace continuity: inspect `traceparent` and session header propagation.
- Queue drops in burst traffic: tune queue size and flush interval.

## Examples
- `examples/browser/example.ts`
- `examples/node-bun/example.ts`
- `examples/react-vite/main.tsx`
- `examples/vue-vite/main.ts`
- `examples/next-app-router/route-handler.ts`
- `examples/nestjs/middleware.ts`
- `examples/express/server.ts`
- `examples/elysia/server.ts`

## Replay Model
Replay is event-based DOM reconstruction (not video).
- snapshot + mutations + input + scroll + viewport + nav/click/network
- SPA navigation capture includes `history.pushState` and `history.replaceState`

## Propagation
- W3C propagation headers: `traceparent`, `tracestate`, `baggage`
- Obtrace session correlation header: `x-obtrace-session-id` (configurable)

## Ingest Endpoints
- `POST /otlp/v1/logs`
- `POST /otlp/v1/traces`
- `POST /otlp/v1/metrics`
- `POST /ingest/replay/chunk`
- `POST /ingest/replay/recipes`

## Documentation
- Docs index: `docs/index.md`
- LLM context file: `llm.txt`
- MCP metadata: `mcp.json`
- Framework wrappers: `docs/framework-wrappers.md`
- Security baseline: `docs/security.md`
- Troubleshooting guide: `docs/troubleshooting.md`

## E2E validation (Ingest + ClickHouse)

```bash
./scripts/dev/validate-sdk-js-clickhouse.sh
```

Manual queries are documented in `docs/clickhouse-validation.md`.

## References
- `specs/sdk/universal-contract-v1.md`
- `docs/requirements-sdk-js-v1.md`
