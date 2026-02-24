// <copyright file="OpenTelemetryRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using SeventySix.Shared.Exceptions;

namespace SeventySix.Api.Registration;

/// <summary>Extension methods for OpenTelemetry configuration.</summary>
public static class OpenTelemetryExtensions
{
	/// <summary>Adds OpenTelemetry with OTLP export for traces and metrics.</summary>
	/// <remarks>
	/// Reads configuration keys:
	/// - "OpenTelemetry:Enabled"
	/// - "OpenTelemetry:ServiceName"
	/// - "OpenTelemetry:ServiceVersion"
	/// - "OpenTelemetry:OtlpEndpoint"
	///
	/// Telemetry is sent to OpenTelemetry Collector via OTLP, which routes:
	/// - Traces to Jaeger
	/// - Metrics to Prometheus (via OTel Collector's Prometheus exporter)
	/// </remarks>
	/// <param name="services">
	/// The service collection.
	/// </param>
	/// <param name="configuration">
	/// The application configuration.
	/// </param>
	/// <param name="environment">
	/// The current environment name.
	/// </param>
	/// <returns>
	/// The service collection for chaining.
	/// </returns>
	public static IServiceCollection AddConfiguredOpenTelemetry(
		this IServiceCollection services,
		IConfiguration configuration,
		string environment)
	{
		// Skip OpenTelemetry in Test environment for performance
		bool isOpenTelemetryEnabled =
			configuration.GetValue<bool>("OpenTelemetry:Enabled");
		if (!isOpenTelemetryEnabled)
		{
			return services;
		}

		string serviceName =
			configuration.GetValue<string>("OpenTelemetry:ServiceName")
			?? throw new RequiredConfigurationException("OpenTelemetry:ServiceName");

		string serviceVersion =
			configuration.GetValue<string>("OpenTelemetry:ServiceVersion")
			?? throw new RequiredConfigurationException("OpenTelemetry:ServiceVersion");

		string otlpEndpoint =
			configuration.GetValue<string>("OpenTelemetry:OtlpEndpoint")
			?? throw new RequiredConfigurationException("OpenTelemetry:OtlpEndpoint");

		Uri otlpEndpointUri =
			new(otlpEndpoint);

		string samplingType =
			configuration.GetValue<string>("OpenTelemetry:Sampling:Type") ?? "AlwaysOn";

		// double is required here: TraceIdRatioBasedSampler(double) is an external API signature
		// that requires double. This is a justified external-API exception per csharp.instructions.md.
		double samplingProbability =
			configuration.GetValue<double>(
				"OpenTelemetry:Sampling:Probability",
				1.0);

		services
			.AddOpenTelemetry()
			.ConfigureResource(resource =>
				resource
					.AddService(
						serviceName: serviceName,
						serviceVersion: serviceVersion)
					.AddAttributes(
						new Dictionary<string, object>
						{
							["deployment.environment"] = environment,
						}))
			.WithTracing(
				tracing =>
				{
					tracing.SetSampler(
						samplingType switch
						{
							"RatioBasedSampling" => new TraceIdRatioBasedSampler(samplingProbability),
							"AlwaysOff" => (Sampler)new AlwaysOffSampler(),
							_ => new AlwaysOnSampler(),
						});

					tracing
						.AddAspNetCoreInstrumentation(
							options =>
							{
								options.RecordException = true;
							})
						.AddHttpClientInstrumentation()
						.AddEntityFrameworkCoreInstrumentation()
						.AddFusionCacheInstrumentation()
						.AddOtlpExporter(
							options =>
							{
								options.Endpoint = otlpEndpointUri;
							});
				})
			.WithMetrics(metrics =>
				metrics
					.AddMeter("SeventySix.Api")
					.AddAspNetCoreInstrumentation()
					.AddHttpClientInstrumentation()
					.AddRuntimeInstrumentation()
					.AddFusionCacheInstrumentation()
					.AddOtlpExporter(
						options =>
						{
							options.Endpoint = otlpEndpointUri;
						}));

		return services;
	}
}