# obtrace-sdk-js

Backend JavaScript SDK for Obtrace (Node.js and Bun).

## Install

```bash
npm install @obtrace/sdk-js
# or
bun add @obtrace/sdk-js
```

## Exports

- `@obtrace/sdk-js` (core + backend wrappers)
- `@obtrace/sdk-js/node` (`initNodeSDK`)

Browser SDK lives in `obtrace-sdk-browser`.

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
```

## Backend wrappers

- Express: `expressObtraceMiddleware`
- Fastify: `fastifyObtraceHook`
- Hono: `honoObtraceMiddleware`
- Elysia: `elysiaObtracePlugin`
- NestJS: `nestObtraceMiddleware`
- Next route handlers: `withNextRouteHandler`

## Docs

- `docs/index.md`
- `docs/getting-started.md`
- `docs/node-bun.md`
- `docs/framework-wrappers.md`
- `docs/security.md`
- `docs/troubleshooting.md`
