import { trace, type Span } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BatchSpanProcessor,
  WebTracerProvider,
} from '@opentelemetry/sdk-trace-web';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { ZoneContextManager } from '@opentelemetry/context-zone';

let initialized = false;

export function initTelemetry(): void {
  if (initialized) return;
  if (typeof window === 'undefined') return;
  if (process.env.NEXT_PUBLIC_OTEL_ENABLED !== 'true') return;

  const endpoint =
    process.env.NEXT_PUBLIC_OTEL_ENDPOINT ?? '/otel/v1/traces';

  const provider = new WebTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: 'utro-ui',
      [ATTR_SERVICE_VERSION]: process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev',
      'deployment.environment.name': process.env.NEXT_PUBLIC_SERVICE_ENV ?? 'development',
    }),
    spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter({ url: endpoint }))],
  });

  provider.register({ contextManager: new ZoneContextManager() });

  const propagateTo = [
    /^http:\/\/localhost:9999/,
    /^http:\/\/localhost:3000\/api/,
    new RegExp(`^${window.location.origin}/api`),
  ];

  const describeElement = (el: EventTarget | null): string => {
    if (!(el instanceof Element)) return '?';
    const interactive =
      el.closest('[data-testid]') ??
      el.closest('button,a,[role="button"],[role="link"],[role="menuitem"],[role="tab"]') ??
      el;
    const testId = interactive.getAttribute('data-testid');
    if (testId) return `[${testId}]`;
    const aria = interactive.getAttribute('aria-label');
    if (aria) return `"${aria.trim().slice(0, 40)}"`;
    const text = (interactive.textContent ?? '').trim().replace(/\s+/g, ' ');
    if (text) return `"${text.slice(0, 40)}"`;
    const tag = interactive.tagName.toLowerCase();
    const id = interactive.id ? `#${interactive.id}` : '';
    return `<${tag}${id}>`;
  };

  const renameByUrl = (span: Span, request: unknown) => {
    let url: string | undefined;
    if (request instanceof Request) url = request.url;
    else if (typeof request === 'string') url = request;
    else if (request instanceof URL) url = request.href;
    if (!url) {
      // fetch(urlStr, init): the instrumentation passes `init` (RequestInit) here,
      // not the URL string. Fall back to attributes the instrumentation already set.
      const attrs = (span as unknown as { attributes?: Record<string, unknown> })
        .attributes;
      const fromAttr = attrs?.['http.url'] ?? attrs?.['url.full'];
      if (typeof fromAttr === 'string') url = fromAttr;
    }
    if (!url) return;
    try {
      const u = new URL(url, window.location.origin);
      const path = u.pathname.replace(/^\/api\/rpc\//, '').replace(/\//g, '.');
      span.updateName(`POST ${path}`);
    } catch {
      // leave default name
    }
  };

  registerInstrumentations({
    instrumentations: [
      new DocumentLoadInstrumentation(),
      new UserInteractionInstrumentation({
        shouldPreventSpanCreation: (eventType, element, span) => {
          span.updateName(`${eventType} ${describeElement(element)}`);
          return false;
        },
      }),
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: propagateTo,
        clearTimingResources: true,
        applyCustomAttributesOnSpan: (span, request) => renameByUrl(span, request),
      }),
      new XMLHttpRequestInstrumentation({
        propagateTraceHeaderCorsUrls: propagateTo,
        applyCustomAttributesOnSpan: (span, xhr) => renameByUrl(span, (xhr as XMLHttpRequest).responseURL),
      }),
    ],
  });

  initialized = true;
  trace.getTracer('utro-ui').startSpan('telemetry.initialized').end();
}
