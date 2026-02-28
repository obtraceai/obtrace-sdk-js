# Obtrace SDK Integration for Kubernetes

## Objetivo
Padronizar configuração da SDK JS (browser e Node/Bun) em ambientes Kubernetes.

## Helm (recomendado)

Use o chart:
- `deploy/helm/obtrace-sdk-integration`

Instalação:

```bash
helm upgrade --install obtrace-sdk-integration \
  ./deploy/helm/obtrace-sdk-integration \
  -n observability --create-namespace \
  -f ./deploy/helm/obtrace-sdk-integration/values-dev.yaml
```

## 1) Secret com chave de ingest

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: obtrace-sdk
type: Opaque
stringData:
  OBTRACE_API_KEY: devkey
```

## 2) ConfigMap com contexto de observabilidade

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: obtrace-sdk-config
data:
  OBTRACE_INGEST_BASE_URL: "http://ingest-edge.obtrace.svc.cluster.local:8080"
  OBTRACE_TENANT_ID: "tenant-dev"
  OBTRACE_PROJECT_ID: "project-dev"
  OBTRACE_ENV: "prod"
```

## 3) Deployment (Node/Bun)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: checkout-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: checkout-api
  template:
    metadata:
      labels:
        app: checkout-api
    spec:
      containers:
        - name: api
          image: ghcr.io/acme/checkout-api:latest
          env:
            - name: OBTRACE_API_KEY
              valueFrom:
                secretKeyRef:
                  name: obtrace-sdk
                  key: OBTRACE_API_KEY
            - name: OBTRACE_INGEST_BASE_URL
              valueFrom:
                configMapKeyRef:
                  name: obtrace-sdk-config
                  key: OBTRACE_INGEST_BASE_URL
            - name: OBTRACE_TENANT_ID
              valueFrom:
                configMapKeyRef:
                  name: obtrace-sdk-config
                  key: OBTRACE_TENANT_ID
            - name: OBTRACE_PROJECT_ID
              valueFrom:
                configMapKeyRef:
                  name: obtrace-sdk-config
                  key: OBTRACE_PROJECT_ID
            - name: OBTRACE_ENV
              valueFrom:
                configMapKeyRef:
                  name: obtrace-sdk-config
                  key: OBTRACE_ENV
```

## 4) Inicialização no backend

```ts
import { initNodeSDK } from "@obtrace/sdk-js/node";

export const obtrace = initNodeSDK({
  apiKey: process.env.OBTRACE_API_KEY!,
  ingestBaseUrl: process.env.OBTRACE_INGEST_BASE_URL!,
  tenantId: process.env.OBTRACE_TENANT_ID,
  projectId: process.env.OBTRACE_PROJECT_ID,
  env: process.env.OBTRACE_ENV,
  appId: "checkout-api",
  serviceName: "checkout-api"
});
```

## 5) Validação

1. gerar tráfego na aplicação.
2. consultar:
   - `GET /v1/logs` em `query-gateway`
   - tabela `obtrace.raw_otlp_7d|30d|90d` no ClickHouse
