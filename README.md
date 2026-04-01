# @obtrace/sdk

Backend JavaScript SDK for Obtrace — Node.js, Bun, and Supabase Edge Functions.

## Install

```bash
npm install @obtrace/sdk
```

## Exports

| Entry point | Function | Runtime |
|---|---|---|
| `@obtrace/sdk/node` | `initNodeSDK` | Node.js, Bun |
| `@obtrace/sdk/supabase` | `initSupabaseSDK` (auto-init) | Supabase Edge Functions (Deno) |

Browser SDK: [`@obtrace/browser`](https://github.com/obtraceai/obtrace-sdk-browser)

## Node.js / Bun

```ts
import { initNodeSDK } from "@obtrace/sdk/node";

const sdk = initNodeSDK({
  apiKey: process.env.OBTRACE_API_KEY!,
  serviceName: "my-api",
});
```

## Supabase Edge Functions

### One-line auto-init

Add a single import to each edge function — the SDK reads `OBTRACE_API_KEY` and `OBTRACE_SERVICE_NAME` from Deno env automatically:

```ts
// supabase/functions/my-function/index.ts
import "@obtrace/sdk/supabase";

Deno.serve(async (req) => {
  // your function code — telemetry is captured automatically
  return new Response("ok");
});
```

Set the secrets in Supabase dashboard (Project Settings > Edge Functions > Secrets):

```
OBTRACE_API_KEY=obt_live_xxxxx
OBTRACE_SERVICE_NAME=my-edge
```

### Explicit init

For full control over configuration:

```ts
import { initSupabaseSDK } from "@obtrace/sdk/supabase";

const sdk = initSupabaseSDK({
  apiKey: Deno.env.get("OBTRACE_API_KEY")!,
  serviceName: "my-edge",
});

sdk.log("info", "function invoked");
```

### Shared init file pattern

For multiple edge functions, create a shared init file:

```ts
// supabase/functions/_shared/obtrace.ts
import "@obtrace/sdk/supabase";
```

Then import in each function:

```ts
// supabase/functions/process-sale/index.ts
import "../_shared/obtrace.ts";

Deno.serve(async (req) => { /* ... */ });
```

## API

```ts
sdk.log(level, message, context?)
sdk.metric(name, value, unit?, context?)
sdk.span({ name, attrs?, statusCode?, statusMessage? })
sdk.captureError(error, context?)
sdk.shutdown()
```

## Canonical Metrics

Use `SemanticMetrics` for metric names normalized by the platform:

```ts
import { SemanticMetrics } from "@obtrace/sdk/node";

sdk.metric(SemanticMetrics.runtimeCpuUtilization, 0.42);
```

## Backend Wrappers

Express, Fastify, Hono, Elysia, NestJS, Next.js route handlers.

## Docs

- [Node/Bun SDK](https://docs.obtrace.ai/docs/sdks/node-bun)
- [Supabase](https://docs.obtrace.ai/docs/platforms/supabase)
- [SDK Catalog](https://docs.obtrace.ai/docs/sdks/catalog)
