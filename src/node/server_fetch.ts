import type { ObtraceClient } from "../core/client";
import { extractPropagation, nowUnixNano, randomHex, sanitizeHeaders, toBase64 } from "../shared/utils";

export function instrumentServerFetch(client: ObtraceClient): typeof fetch {
  const baseFetch = globalThis.fetch.bind(globalThis);

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const method = (init?.method ?? "GET").toUpperCase();
    const url = typeof input === "string" ? input : input.toString();
    const startMs = Date.now();
    const startNs = nowUnixNano();
    const inboundTrace = extractPropagation(init?.headers);
    const traceId = inboundTrace?.traceId ?? randomHex(16);
    const spanId = randomHex(8);

    const headers = client.injectPropagation(init?.headers, {
      traceId,
      spanId,
      traceState: inboundTrace.traceState,
      baggage: inboundTrace.baggage
    });

    try {
      const response = await baseFetch(input, {
        ...init,
        headers
      });

      const dur = Date.now() - startMs;
      const reqBody = init?.body && typeof init.body === "string" ? toBase64(init.body) : undefined;

      client.log("info", `outbound ${method} ${url} -> ${response.status}`, {
        traceId,
        spanId,
        method,
        endpoint: url,
        statusCode: response.status,
        attrs: {
          duration_ms: dur,
          req_headers: JSON.stringify(sanitizeHeaders(headers)),
          res_headers: JSON.stringify(sanitizeHeaders(response.headers)),
          req_body_b64_len: reqBody ? reqBody.length : 0
        }
      });

      client.span({
        name: `server.fetch ${method}`,
        traceId,
        spanId,
        parentSpanId: inboundTrace?.parentSpanId,
        startUnixNano: startNs,
        endUnixNano: nowUnixNano(),
        statusCode: response.status,
        attrs: {
          "http.method": method,
          "http.url": url,
          "http.status_code": response.status,
          "http.duration_ms": dur
        }
      });

      return response;
    } catch (err) {
      const dur = Date.now() - startMs;
      client.span({
        name: `server.fetch ${method}`,
        traceId,
        spanId,
        parentSpanId: inboundTrace?.parentSpanId,
        startUnixNano: startNs,
        endUnixNano: nowUnixNano(),
        statusCode: 500,
        statusMessage: String(err),
        attrs: {
          "http.method": method,
          "http.url": url,
          "http.duration_ms": dur
        }
      });
      client.log("error", `outbound ${method} ${url} failed: ${String(err)}`, {
        traceId,
        spanId,
        method,
        endpoint: url,
        attrs: { duration_ms: dur }
      });
      throw err;
    }
  };
}
