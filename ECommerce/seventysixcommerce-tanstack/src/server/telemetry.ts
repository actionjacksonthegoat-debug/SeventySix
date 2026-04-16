import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { isPresent } from "@seventysixcommerce/shared/utils";

/** The OpenTelemetry service name for the TanStack commerce site. */
const SERVICE_NAME: string = "seventysixcommerce-tanstack";

/** Singleton SDK instance — prevents double initialization. */
let sdk: NodeSDK | undefined;

/**
 * Initializes OpenTelemetry with OTLP exporters for traces and metrics.
 * Safe to call multiple times — subsequent calls are no-ops.
 * @param otlpEndpoint The OTLP HTTP endpoint (e.g., `http://otel-collector:4318`). Empty string disables telemetry.
 */
export function initTelemetry(otlpEndpoint: string): void
{
	if (otlpEndpoint === "" || isPresent(sdk))
	{
		return;
	}

	const traceExporter: OTLPTraceExporter =
		new OTLPTraceExporter(
			{ url: `${otlpEndpoint}/v1/traces` });

	const metricReader: PeriodicExportingMetricReader =
		new PeriodicExportingMetricReader(
			{
				exporter: new OTLPMetricExporter(
					{ url: `${otlpEndpoint}/v1/metrics` }),
				exportIntervalMillis: 15_000
			});

	sdk =
		new NodeSDK(
			{
				serviceName: SERVICE_NAME,
				traceExporter,
				metricReader,
				instrumentations: [getNodeAutoInstrumentations()]
			});

	sdk.start();
}

/**
 * Gracefully shuts down the OpenTelemetry SDK, flushing pending telemetry.
 * Should be called on process exit.
 */
export async function shutdownTelemetry(): Promise<void>
{
	if (isPresent(sdk))
	{
		await sdk.shutdown();
		sdk = undefined;
	}
}