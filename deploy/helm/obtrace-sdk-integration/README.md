# obtrace-sdk-integration Helm Chart

Helm chart for provisioning Obtrace SDK integration settings in Kubernetes:
- Secret with `OBTRACE_API_KEY`
- ConfigMap with ingest/project context
- Optional demo Deployment

## Install

```bash
helm upgrade --install obtrace-sdk-integration \
  ./deploy/helm/obtrace-sdk-integration \
  -n observability --create-namespace \
  -f ./deploy/helm/obtrace-sdk-integration/values-dev.yaml
```

## Production values

```bash
helm upgrade --install obtrace-sdk-integration \
  ./deploy/helm/obtrace-sdk-integration \
  -n observability \
  -f ./deploy/helm/obtrace-sdk-integration/values-prod.yaml
```

## Notes

- Keep `workload.enabled=false` for existing applications.
- Use the rendered Secret/ConfigMap references in your own Deployments.
