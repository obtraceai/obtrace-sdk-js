# ClickHouse E2E Validation

Use this to validate SDK JS ingestion end-to-end:
- ingest-edge accepts OTLP + replay payloads
- workers persist data
- ClickHouse contains evidence for logs/traces/metrics + replay index + recipes

## Automated

```bash
./scripts/dev/validate-sdk-js-clickhouse.sh
```

Options:
- `--skip-up`: does not run `scripts/dev/up.sh`
- `--no-build`: when running up, skip image build
- `--timeout-sec=<n>`: polling timeout (default `120`)

## Manual queries

Replace `<MARKER>` and `<CHUNK_HASH>` with values printed by the script.

### OTLP rows (logs + traces + metrics)

```sql
SELECT signal, count()
FROM (
  SELECT tenant_id, project_id, env, signal, payload_b64 FROM obtrace.raw_otlp_7d
  UNION ALL
  SELECT tenant_id, project_id, env, signal, payload_b64 FROM obtrace.raw_otlp_30d
  UNION ALL
  SELECT tenant_id, project_id, env, signal, payload_b64 FROM obtrace.raw_otlp_90d
)
WHERE tenant_id = 'tenant-dev'
  AND project_id = 'project-dev'
  AND env = 'dev'
  AND position(base64Decode(payload_b64), '<MARKER>') > 0
GROUP BY signal
ORDER BY signal;
```

### Replay index row (DOM chunk)

```sql
SELECT ts, replay_id, event_id, chunk_hash, size_bytes
FROM (
  SELECT ts, tenant_id, project_id, env, replay_id, event_id, chunk_hash, size_bytes FROM obtrace.replay_index_7d
  UNION ALL
  SELECT ts, tenant_id, project_id, env, replay_id, event_id, chunk_hash, size_bytes FROM obtrace.replay_index_30d
  UNION ALL
  SELECT ts, tenant_id, project_id, env, replay_id, event_id, chunk_hash, size_bytes FROM obtrace.replay_index_90d
)
WHERE tenant_id = 'tenant-dev'
  AND project_id = 'project-dev'
  AND env = 'dev'
  AND chunk_hash = '<CHUNK_HASH>'
ORDER BY ts DESC
LIMIT 5;
```

### Network recipe rows

```sql
SELECT count()
FROM (
  SELECT tenant_id, project_id, env, payload_b64 FROM obtrace.network_recipes_7d
  UNION ALL
  SELECT tenant_id, project_id, env, payload_b64 FROM obtrace.network_recipes_30d
  UNION ALL
  SELECT tenant_id, project_id, env, payload_b64 FROM obtrace.network_recipes_90d
)
WHERE tenant_id = 'tenant-dev'
  AND project_id = 'project-dev'
  AND env = 'dev'
  AND position(base64Decode(payload_b64), '<MARKER>') > 0;
```
