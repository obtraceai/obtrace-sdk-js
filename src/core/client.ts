import { SpanStatusCode, type Tracer, type Meter, type Span } from "@opentelemetry/api";
import { SeverityNumber, type Logger } from "@opentelemetry/api-logs";
import type { NodeSDK } from "@opentelemetry/sdk-node";
import type { LogLevel, ObtraceSDKConfig, SDKContext } from "../shared/types";
import { setupOtel } from "./otel-setup";

const SEVERITY_MAP: Record<LogLevel, SeverityNumber> = {
  debug: SeverityNumber.DEBUG,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
  fatal: SeverityNumber.FATAL,
};

export class ObtraceClient {
  private readonly sdk: NodeSDK;
  private readonly tracer: Tracer;
  private readonly meter: Meter;
  private readonly otelLogger: Logger;
  private readonly config: ObtraceSDKConfig;
  private readonly gauges = new Map<string, ReturnType<Meter["createObservableGauge"]>>();
  private readonly gaugeValues = new Map<string, { value: number; attrs: Record<string, string | number | boolean> }>();

  constructor(config: ObtraceSDKConfig) {
    if (!config.apiKey || !config.ingestBaseUrl || !config.serviceName) {
      throw new Error("apiKey, ingestBaseUrl and serviceName are required");
    }
    this.config = config;
    const handle = setupOtel(config);
    this.sdk = handle.sdk;
    this.tracer = handle.tracer;
    this.meter = handle.meter;
    this.otelLogger = handle.logger;
  }

  log(level: LogLevel, message: string, context?: SDKContext): void {
    const attrs: Record<string, string | number | boolean> = {};
    if (context?.traceId) attrs["obtrace.trace_id"] = context.traceId;
    if (context?.spanId) attrs["obtrace.span_id"] = context.spanId;
    if (context?.sessionId) attrs["obtrace.session_id"] = context.sessionId;
    if (context?.routeTemplate) attrs["obtrace.route_template"] = context.routeTemplate;
    if (context?.endpoint) attrs["obtrace.endpoint"] = context.endpoint;
    if (context?.method) attrs["obtrace.method"] = context.method;
    if (typeof context?.statusCode === "number") attrs["obtrace.status_code"] = context.statusCode;
    if (context?.attrs) {
      for (const [k, v] of Object.entries(context.attrs)) {
        attrs[`obtrace.attr.${k}`] = v;
      }
    }

    this.otelLogger.emit({
      severityNumber: SEVERITY_MAP[level] ?? SeverityNumber.INFO,
      severityText: level.toUpperCase(),
      body: message,
      attributes: attrs,
    });
  }

  metric(name: string, value: number, unit?: string, context?: SDKContext): void {
    const attrs = context?.attrs ?? {};
    const key = `${name}:${unit ?? "1"}`;
    this.gaugeValues.set(key, { value, attrs });
    if (!this.gauges.has(key)) {
      const gauge = this.meter.createObservableGauge(name, { unit: unit ?? "1" });
      gauge.addCallback((result) => {
        const current = this.gaugeValues.get(key);
        if (current) result.observe(current.value, current.attrs);
      });
      this.gauges.set(key, gauge);
    }
  }

  span(input: {
    name: string;
    traceId?: string;
    spanId?: string;
    parentSpanId?: string;
    startUnixNano?: string;
    endUnixNano?: string;
    statusCode?: number;
    statusMessage?: string;
    attrs?: Record<string, string | number | boolean>;
  }): { traceId: string; spanId: string } {
    const span = this.tracer.startSpan(input.name, {
      attributes: input.attrs,
    });

    if (typeof input.statusCode === "number" && input.statusCode >= 400) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: input.statusMessage });
    } else {
      span.setStatus({ code: SpanStatusCode.OK });
    }

    span.end();

    const ctx = span.spanContext();
    return { traceId: ctx.traceId, spanId: ctx.spanId };
  }

  getTracer(): Tracer {
    return this.tracer;
  }

  getMeter(): Meter {
    return this.meter;
  }

  getLogger(): Logger {
    return this.otelLogger;
  }

  stop(): void {
    // no-op for backward compat
  }

  async shutdown(): Promise<void> {
    await this.sdk.shutdown();
  }
}
