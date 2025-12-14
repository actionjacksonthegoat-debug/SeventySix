import { inject, Injectable } from "@angular/core";
import { environment } from "@environments/environment";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { DocumentLoadInstrumentation } from "@opentelemetry/instrumentation-document-load";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { Resource } from "@opentelemetry/resources";
import {
	AlwaysOffSampler,
	AlwaysOnSampler,
	BatchSpanProcessor,
	Sampler,
	TraceIdRatioBasedSampler,
	WebTracerProvider
} from "@opentelemetry/sdk-trace-web";
import {
	ATTR_SERVICE_NAME,
	ATTR_SERVICE_VERSION
} from "@opentelemetry/semantic-conventions";
import { LoggerService } from "./logger.service";

/**
 * OpenTelemetry service for distributed tracing in Angular 20.
 * Automatically instruments document load and fetch API calls.
 * Follows KISS principle with minimal configuration.
 */
@Injectable(
	{
		providedIn: "root"
	})
export class TelemetryService
{
	private readonly logger: LoggerService =
		inject(LoggerService);
	private provider: WebTracerProvider | null = null;
	private initialized: boolean = false;

	/**
	 * Initializes OpenTelemetry tracing with automatic instrumentation.
	 * Called by APP_INITIALIZER during application bootstrap.
	 */
	public initialize(): void
	{
		if (!environment.telemetry.enabled) return;

		if (this.initialized)
		{
			this.logger.warning("Telemetry already initialized");
			return;
		}

		try
		{
			this.setupTelemetryProvider();
			this.initialized = true;
		}
		catch (error: unknown)
		{
			this.logger.error(
				"Failed to initialize OpenTelemetry",
				error instanceof Error ? error : undefined);
		}
	}

	/**
	 * Sets up the OpenTelemetry provider with instrumentation.
	 */
	private setupTelemetryProvider(): void
	{
		// Create resource with service metadata
		const resource: Resource =
			new Resource(
				{
					[ATTR_SERVICE_NAME]: environment.telemetry.serviceName,
					[ATTR_SERVICE_VERSION]: environment.telemetry.serviceVersion
				});

		// Create OTLP HTTP exporter for Jaeger
		const exporter: OTLPTraceExporter =
			new OTLPTraceExporter(
				{
					url: environment.telemetry.otlpEndpoint
				});

		// Create tracer provider with batch processor
		this.provider =
			new WebTracerProvider(
				{
					resource,
					sampler: this.createSampler()
				});

		// Add batch span processor for efficient export
		this.provider.addSpanProcessor(new BatchSpanProcessor(exporter));

		// Register provider globally
		this.provider.register();

		// Register automatic instrumentations
		registerInstrumentations(
			{
				instrumentations: [
					new DocumentLoadInstrumentation(), // Page load timing
					new FetchInstrumentation(
						{
							// Propagate trace context to backend
							propagateTraceHeaderCorsUrls: [
								new RegExp(environment.apiUrl)
							]
						})
				]
			});
	}

	/**
	 * Creates a sampler based on configuration.
	 */
	private createSampler(): Sampler
	{
		const sampleRate: number =
			environment.telemetry.sampleRate;

		if (sampleRate >= 1.0)
		{
			return new AlwaysOnSampler();
		}
		else if (sampleRate <= 0)
		{
			return new AlwaysOffSampler();
		}
		else
		{
			return new TraceIdRatioBasedSampler(sampleRate);
		}
	}

	/**
	 * Shuts down the telemetry provider.
	 * Called during application cleanup.
	 */
	public async shutdown(): Promise<void>
	{
		if (this.provider)
		{
			await this.provider.shutdown();
			this.logger.info("OpenTelemetry shutdown complete");
		}
	}
}
