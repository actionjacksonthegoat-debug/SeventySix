import { type Span, trace } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { type Resource } from "@opentelemetry/resources";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-web";
import { buildResource } from "@seventysixcommerce/shared/observability";
import { isNullOrUndefined, isPresent } from "@seventysixcommerce/shared/utils";

/** The OpenTelemetry service name for the SvelteKit browser client. */
const SERVICE_NAME: string = "seventysixcommerce-sveltekit-browser";

/** Singleton flag — prevents double initialization. */
let initialized: boolean = false;

/** The tracer instance for browser-side telemetry. */
let tracer: ReturnType<typeof trace.getTracer> | undefined;

/**
 * Initializes browser-side OpenTelemetry with OTLP trace exporting.
 * Tracks page navigations and Web Vitals (LCP, CLS, INP).
 * Safe to call multiple times — subsequent calls are no-ops.
 * @param otlpEndpoint The OTLP HTTP endpoint accessible from the browser. Empty string disables telemetry.
 */
export function initClientTelemetry(otlpEndpoint: string): void
{
	if (otlpEndpoint === "" || initialized)
	{
		return;
	}

	const resource: Resource =
		buildResource({ serviceName: SERVICE_NAME });

	const exporter: OTLPTraceExporter =
		new OTLPTraceExporter(
			{ url: `${otlpEndpoint}/v1/traces` });

	const provider: WebTracerProvider =
		new WebTracerProvider(
			{
				resource,
				spanProcessors: [new BatchSpanProcessor(exporter)]
			});

	provider.register();

	tracer =
		trace.getTracer(SERVICE_NAME);

	initialized = true;

	observeWebVitals();
}

/**
 * Records a page navigation span for the given URL path.
 * @param path The URL path navigated to (e.g., "/shop/prints").
 */
export function recordNavigation(path: string): void
{
	if (isNullOrUndefined(tracer))
	{
		return;
	}

	const span: Span =
		tracer.startSpan("page.navigation",
			{ attributes: { "page.path": path } });
	span.end();
}

/**
 * Records a commerce interaction event as a trace span.
 * @param eventName The commerce event name (e.g., "product.view", "cart.add").
 * @param attributes Key-value attributes for the event.
 */
export function recordCommerceEvent(
	eventName: string,
	attributes: Record<string, string>): void
{
	if (isNullOrUndefined(tracer))
	{
		return;
	}

	const span: Span =
		tracer.startSpan(`commerce.${eventName}`,
			{ attributes });
	span.end();
}

/**
 * Observes Web Vitals (LCP, CLS, INP) using the native PerformanceObserver API
 * and records them as trace spans. Only runs in supporting browsers.
 */
function observeWebVitals(): void
{
	if (typeof PerformanceObserver === "undefined" || isNullOrUndefined(tracer))
	{
		return;
	}

	observeLcp();
	observeCls();
	observeInp();
}

/** Observes Largest Contentful Paint metrics. */
function observeLcp(): void
{
	try
	{
		const observer: PerformanceObserver =
			new PerformanceObserver(
				(list) =>
				{
					const entries: PerformanceEntryList =
						list.getEntries();
					const lastEntry: PerformanceEntry | undefined =
						entries[entries.length - 1];
					if (isPresent(lastEntry) && isPresent(tracer))
					{
						const span: Span =
							tracer.startSpan("web_vital.lcp",
								{
									attributes: {
										"web_vital.name": "LCP",
										"web_vital.value_ms": lastEntry.startTime.toString()
									}
								});
						span.end();
					}
				});
		observer.observe(
			{ type: "largest-contentful-paint", buffered: true });
	}
	catch
	{
		// PerformanceObserver type not supported in this browser
	}
}

/** Observes Cumulative Layout Shift metrics. */
function observeCls(): void
{
	try
	{
		let clsValue: number = 0;
		const observer: PerformanceObserver =
			new PerformanceObserver(
				(list) =>
				{
					for (const entry of list.getEntries())
					{
						if (!(entry as PerformanceEntry & { hadRecentInput?: boolean; }).hadRecentInput)
						{
							clsValue += (entry as PerformanceEntry & { value: number; }).value;
						}
					}
				});
		observer.observe(
			{ type: "layout-shift", buffered: true });

		// Report CLS on page hide
		document.addEventListener("visibilitychange",
			() =>
			{
				if (document.visibilityState === "hidden" && isPresent(tracer))
				{
					const span: Span =
						tracer.startSpan("web_vital.cls",
							{
								attributes: {
									"web_vital.name": "CLS",
									"web_vital.value": clsValue.toFixed(4)
								}
							});
					span.end();
				}
			});
	}
	catch
	{
		// PerformanceObserver type not supported in this browser
	}
}

/** Observes Interaction to Next Paint metrics. */
function observeInp(): void
{
	try
	{
		const observer: PerformanceObserver =
			new PerformanceObserver(
				(list) =>
				{
					for (const entry of list.getEntries())
					{
						if (isPresent(tracer))
						{
							const span: Span =
								tracer.startSpan("web_vital.inp",
									{
										attributes: {
											"web_vital.name": "INP",
											"web_vital.value_ms": entry.duration.toString()
										}
									});
							span.end();
						}
					}
				});
		observer.observe(
			{ type: "event", buffered: true });
	}
	catch
	{
		// PerformanceObserver type not supported in this browser
	}
}