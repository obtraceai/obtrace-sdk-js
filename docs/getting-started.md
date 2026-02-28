# Getting Started

## Install

```bash
npm install @obtrace/sdk-js
# or
bun add @obtrace/sdk-js
```

## Minimal Node/Bun setup

```ts
import { initNodeSDK } from "@obtrace/sdk-js/node";

const sdk = initNodeSDK({
  apiKey: process.env.OBTRACE_API_KEY!,
  ingestBaseUrl: process.env.OBTRACE_INGEST_BASE_URL!,
  serviceName: "api-service",
  env: "prod"
});
```

## Core client setup (edge/serverless)

```ts
import { ObtraceClient } from "@obtrace/sdk-js";

const client = new ObtraceClient({
  apiKey: process.env.OBTRACE_API_KEY!,
  ingestBaseUrl: process.env.OBTRACE_INGEST_BASE_URL!,
  serviceName: "edge-service"
});
```
