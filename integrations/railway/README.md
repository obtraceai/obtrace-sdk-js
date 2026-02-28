# Obtrace SDK Integration for Railway

## 1) Variáveis de ambiente no Railway

Defina no serviço:
- `OBTRACE_API_KEY`
- `OBTRACE_INGEST_BASE_URL`
- `OBTRACE_TENANT_ID`
- `OBTRACE_PROJECT_ID`
- `OBTRACE_ENV`

Exemplo:
- `OBTRACE_API_KEY=devkey`
- `OBTRACE_INGEST_BASE_URL=https://injet.obtrace.ai`
- `OBTRACE_TENANT_ID=tenant-dev`
- `OBTRACE_PROJECT_ID=project-dev`
- `OBTRACE_ENV=production`

## 2) Inicialização no backend Node/Bun

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

## 3) Frontend em Railway

```ts
import { initBrowserSDK } from "@obtrace/sdk-js/browser";

const sdk = initBrowserSDK({
  apiKey: import.meta.env.VITE_OBTRACE_API_KEY,
  ingestBaseUrl: import.meta.env.VITE_OBTRACE_INGEST_BASE_URL,
  tenantId: import.meta.env.VITE_OBTRACE_TENANT_ID,
  projectId: import.meta.env.VITE_OBTRACE_PROJECT_ID,
  env: import.meta.env.MODE,
  appId: "railway-web",
  serviceName: "railway-web"
});
```

## 4) Checklist de validação

1. Deploy no Railway com variáveis preenchidas.
2. Gerar uma requisição no backend e uma ação no frontend.
3. Validar em `query-gateway`:
   - `/v1/logs`
   - `/v1/replay/index`
4. Validar no ClickHouse:
   - `obtrace.raw_otlp_<tier>`
   - `obtrace.replay_index_<tier>`
