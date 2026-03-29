# Node/Bun SDK

## Features
- OTLP logs/traces/metrics
- Outbound fetch instrumentation with propagation
- uncaughtException / unhandledRejection hooks

## Example

```ts
const sdk = initNodeSDK({
  apiKey: process.env.OBTRACE_API_KEY!,
  serviceName: "checkout-api"
});

const res = await sdk.instrumentFetch("https://httpbin.org/status/200");
sdk.log("info", "request done", { statusCode: res.status });
await sdk.shutdown();
```
