import { NodeSDK } from "@opentelemetry/sdk-node";
import { Resource } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION, SEMRESATTRS_DEPLOYMENT_ENVIRONMENT } from "@opentelemetry/semantic-conventions";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { trace, metrics, type Tracer, type Meter } from "@opentelemetry/api";
import { logs, type Logger } from "@opentelemetry/api-logs";
import type { ObtraceSDKConfig } from "../shared/types";

export interface OtelHandle {
  sdk: NodeSDK;
  tracer: Tracer;
  meter: Meter;
  logger: Logger;
}

export function setupOtel(config: ObtraceSDKConfig): OtelHandle {
  const baseUrl = config.ingestBaseUrl.replace(/\/$/, "");
  const authHeaders = {
    Authorization: `Bearer ${config.apiKey}`,
    ...(config.defaultHeaders ?? {}),
  };

  const resource = new Resource({
    [ATTR_SERVICE_NAME]: config.serviceName,
    [ATTR_SERVICE_VERSION]: config.serviceVersion ?? "0.0.0",
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: config.env ?? "dev",
    ...(config.tenantId ? { "obtrace.tenant_id": config.tenantId } : {}),
    ...(config.projectId ? { "obtrace.project_id": config.projectId } : {}),
    ...(config.appId ? { "obtrace.app_id": config.appId } : {}),
    ...(config.env ? { "obtrace.env": config.env } : {}),
  });

  const traceExporter = new OTLPTraceExporter({
    url: `${baseUrl}/otlp/v1/traces`,
    headers: authHeaders,
    timeoutMillis: config.requestTimeoutMs ?? 5000,
  });

  const logExporter = new OTLPLogExporter({
    url: `${baseUrl}/otlp/v1/logs`,
    headers: authHeaders,
    timeoutMillis: config.requestTimeoutMs ?? 5000,
  });

  const metricExporter = new OTLPMetricExporter({
    url: `${baseUrl}/otlp/v1/metrics`,
    headers: authHeaders,
    timeoutMillis: config.requestTimeoutMs ?? 5000,
  });

  const sdk = new NodeSDK({
    resource,
    autoDetectResources: false,
    spanProcessor: new BatchSpanProcessor(traceExporter, {
      maxQueueSize: config.maxQueueSize ?? 1000,
      maxExportBatchSize: 128,
      scheduledDelayMillis: config.flushIntervalMs ?? 2000,
    }),
    logRecordProcessor: new BatchLogRecordProcessor(logExporter, {
      maxQueueSize: config.maxQueueSize ?? 1000,
      maxExportBatchSize: 128,
      scheduledDelayMillis: config.flushIntervalMs ?? 2000,
    }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: config.flushIntervalMs ?? 5000,
    }),
    instrumentations: [],
  });

  sdk.start();

  setImmediate(() => {
    try {
      const instrumentations = getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
      });
      for (const inst of instrumentations) {
        inst.enable();
      }
    } catch (err) {
      console.warn("[obtrace] auto-instrumentation failed:", err);
    }
  });

  const tracer = trace.getTracer("@obtrace/sdk-js", "1.1.2");
  const meter = metrics.getMeter("@obtrace/sdk-js", "1.1.2");
  const logger = logs.getLogger("@obtrace/sdk-js", "1.1.2");

  return { sdk, tracer, meter, logger };
}
