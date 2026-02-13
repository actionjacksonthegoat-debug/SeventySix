import {
	inject,
	Injectable
} from "@angular/core";
import { environment } from "@environments/environment";
import { LoggerService } from "@shared/services/logger.service";
import {
	take,
	timer
} from "rxjs";

/**
 * Delay before initializing telemetry (milliseconds).
 * Allows initial render to complete first.
 * @type {number}
 */
const TELEMETRY_INIT_DELAY_MS: number = 1000;

/**
 * Aggregated OpenTelemetry module exports from dynamic imports.
 * Using unknown for constructor types to allow dynamic imports.
 */
interface TelemetryModules
{
	OTLPTraceExporter: unknown;
	registerInstrumentations: unknown;
	DocumentLoadInstrumentation: unknown;
	FetchInstrumentation: unknown;
	resourceFromAttributes: unknown;
	AlwaysOffSampler: unknown;
	AlwaysOnSampler: unknown;
	BatchSpanProcessor: unknown;
	TraceIdRatioBasedSampler: unknown;
	WebTracerProvider: unknown;
	ATTR_SERVICE_NAME: string;
	ATTR_SERVICE_VERSION: string;
}

/**
 * WebTracerProvider instance interface. */
interface WebTracerProviderInstance
{
	register(): void;
}

/**
 * OpenTelemetry service for distributed tracing in Angular.
 * Dynamically imports OpenTelemetry packages to reduce initial bundle.
 * Automatically instruments document load and fetch API calls.
 *
 * Supports: Grafana, Prometheus, Jaeger integration via OTLP export.
 */
@Injectable(
	{
		providedIn: "root"
	})
export class TelemetryService
{
	/**
	 * Logger service for telemetry diagnostics.
	 * @type {LoggerService}
	 * @private
	 * @readonly
	 */
	private readonly logger: LoggerService =
		inject(LoggerService);

	/**
	 * Tracks whether telemetry has already been initialized to avoid duplicate setup.
	 * @type {boolean}
	 * @private
	 */
	private initialized: boolean = false;

	/**
	 * Initializes OpenTelemetry tracing with automatic instrumentation.
	 * Called by APP_INITIALIZER during application bootstrap.
	 * Defers actual initialization to not block initial render.
	 * @returns {void}
	 */
	public initialize(): void
	{
		if (!environment.telemetry.enabled)
		{
			return;
		}

		if (this.initialized)
		{
			this.logger.warning("Telemetry already initialized");
			return;
		}

		// Defer telemetry setup to not block initial render
		timer(TELEMETRY_INIT_DELAY_MS)
			.pipe(take(1))
			.subscribe(
				() =>
				{
					this.initializeTelemetryAsync();
				});
	}

	/**
	 * Performs async telemetry initialization with dynamic imports.
	 * This moves OpenTelemetry packages out of the initial bundle.
	 * @returns {Promise<void>}
	 */
	private async initializeTelemetryAsync(): Promise<void>
	{
		try
		{
			const modules: TelemetryModules =
				await this.loadTelemetryModules();

			const provider: WebTracerProviderInstance =
				this.createTracerProvider(modules);

			provider.register();

			this.registerInstrumentations(modules);

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
	 * Loads all OpenTelemetry modules via dynamic imports.
	 * @returns {Promise<TelemetryModules>}
	 * Resolves to the aggregated telemetry module exports.
	 */
	private async loadTelemetryModules(): Promise<TelemetryModules>
	{
		const [
			otlpModule,
			instrModule,
			docLoadModule,
			fetchModule,
			resourceModule,
			sdkModule,
			convModule
		] =
			await Promise.all(
				[
					import("@opentelemetry/exporter-trace-otlp-http"),
					import("@opentelemetry/instrumentation"),
					import("@opentelemetry/instrumentation-document-load"),
					import("@opentelemetry/instrumentation-fetch"),
					import("@opentelemetry/resources"),
					import("@opentelemetry/sdk-trace-web"),
					import("@opentelemetry/semantic-conventions")
				]);

		return {
			OTLPTraceExporter: otlpModule.OTLPTraceExporter,
			registerInstrumentations: instrModule.registerInstrumentations,
			DocumentLoadInstrumentation: docLoadModule.DocumentLoadInstrumentation,
			FetchInstrumentation: fetchModule.FetchInstrumentation,
			resourceFromAttributes: resourceModule.resourceFromAttributes,
			AlwaysOffSampler: sdkModule.AlwaysOffSampler,
			AlwaysOnSampler: sdkModule.AlwaysOnSampler,
			BatchSpanProcessor: sdkModule.BatchSpanProcessor,
			TraceIdRatioBasedSampler: sdkModule.TraceIdRatioBasedSampler,
			WebTracerProvider: sdkModule.WebTracerProvider,
			ATTR_SERVICE_NAME: convModule.ATTR_SERVICE_NAME,
			ATTR_SERVICE_VERSION: convModule.ATTR_SERVICE_VERSION
		};
	}

	/**
	 * Creates the WebTracerProvider with resource, sampler, and span processor.
	 * @param {TelemetryModules} modules
	 * The loaded telemetry modules to construct provider and exporter.
	 * @returns {WebTracerProviderInstance}
	 * Configured tracer provider instance.
	 */
	private createTracerProvider(modules: TelemetryModules): WebTracerProviderInstance
	{
		const createResource: (attributes: Record<string, unknown>) => unknown =
			modules.resourceFromAttributes as (
				attributes: Record<string, unknown>) => unknown;
		const resource: unknown =
			createResource(
				{
					[modules.ATTR_SERVICE_NAME]: environment.telemetry.serviceName,
					[modules.ATTR_SERVICE_VERSION]: environment.telemetry.serviceVersion
				});

		const ExporterConstructor: new(config: unknown) => unknown =
			modules.OTLPTraceExporter as new(
				config: unknown) => unknown;
		const exporter: unknown =
			new ExporterConstructor(
				{
					url: environment.telemetry.otlpEndpoint
				});

		const sampler: unknown =
			this.createSampler(
				modules.AlwaysOffSampler as new() => unknown,
				modules.AlwaysOnSampler as new() => unknown,
				modules.TraceIdRatioBasedSampler as new(ratio: number) => unknown);

		const ProcessorConstructor: new(exporter: unknown) => unknown =
			modules.BatchSpanProcessor as new(
				exporter: unknown) => unknown;
		const spanProcessor: unknown =
			new ProcessorConstructor(exporter);

		const ProviderConstructor: new(config: unknown) => WebTracerProviderInstance =
			modules.WebTracerProvider as new(
				config: unknown) => WebTracerProviderInstance;
		const provider: WebTracerProviderInstance =
			new ProviderConstructor(
				{
					resource,
					sampler,
					spanProcessors: [spanProcessor]
				});

		return provider;
	}

	/**
	 * Registers automatic instrumentations for document load and fetch.
	 * @param {TelemetryModules} modules
	 * The telemetry modules containing instrumentation constructors.
	 * @returns {void}
	 */
	private registerInstrumentations(modules: TelemetryModules): void
	{
		const registerFunction: (config: unknown) => void =
			modules.registerInstrumentations as (
				config: unknown) => void;
		const DocLoadConstructor: new() => unknown =
			modules.DocumentLoadInstrumentation as new() => unknown;
		const FetchConstructor: new(config: unknown) => unknown =
			modules.FetchInstrumentation as new(
				config: unknown) => unknown;

		registerFunction(
			{
				instrumentations: [
					new DocLoadConstructor(),
					new FetchConstructor(
						{
							propagateTraceHeaderCorsUrls: [
								new RegExp(environment.apiUrl)
							],
							clearTimingResources: true
						})
				]
			});
	}

	/**
	 * Creates the appropriate sampler based on environment configuration.
	 * @param {new () => unknown} AlwaysOffSampler
	 * Constructor for an AlwaysOff sampler.
	 * @param {new () => unknown} AlwaysOnSampler
	 * Constructor for an AlwaysOn sampler.
	 * @param {new (ratio: number) => unknown} TraceIdRatioBasedSampler
	 * Constructor for a TraceIdRatioBased sampler.
	 * @returns {unknown}
	 * A configured sampler instance appropriate for the current sample rate.
	 */
	private createSampler(
		AlwaysOffSampler: new() => unknown,
		AlwaysOnSampler: new() => unknown,
		TraceIdRatioBasedSampler: new(ratio: number) => unknown): unknown
	{
		const sampleRate: number =
			environment.telemetry.sampleRate;

		if (sampleRate <= 0)
		{
			return new AlwaysOffSampler();
		}

		if (sampleRate >= 1)
		{
			return new AlwaysOnSampler();
		}

		return new TraceIdRatioBasedSampler(sampleRate);
	}
}
