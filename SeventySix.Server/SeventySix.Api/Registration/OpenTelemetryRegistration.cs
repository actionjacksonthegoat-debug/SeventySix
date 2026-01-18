// <copyright file="OpenTelemetryRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using ZiggyCreatures.Caching.Fusion.OpenTelemetry;

namespace SeventySix.Api.Registration;

/// <summary>Extension methods for OpenTelemetry configuration.</summary>
public static class OpenTelemetryExtensions
{
	/// <summary>Adds OpenTelemetry with Jaeger tracing and Prometheus metrics.</summary>
	/// <remarks>
	/// Reads configuration keys:
	/// - "OpenTelemetry:Enabled"
	/// - "OpenTelemetry:ServiceName"
	/// - "OpenTelemetry:ServiceVersion"
	/// - "OpenTelemetry:OtlpEndpoint"
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
		bool enabled =
			configuration.GetValue<bool?>("OpenTelemetry:Enabled") ?? true;
		if (!enabled)
		{
			return services;
		}

		string serviceName =
			configuration.GetValue<string>("OpenTelemetry:ServiceName")
			?? "SeventySix.Api";

		string serviceVersion =
			configuration.GetValue<string>("OpenTelemetry:ServiceVersion")
			?? "1.0.0";

		string otlpEndpoint =
			configuration.GetValue<string>("OpenTelemetry:OtlpEndpoint")
			?? "http://localhost:4317";

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
			.WithTracing(tracing =>
				tracing
					.AddAspNetCoreInstrumentation(
						options =>
						{
							options.RecordException = true;
						})
					.AddHttpClientInstrumentation()
					.AddFusionCacheInstrumentation()
					.AddOtlpExporter(
						options =>
						{
							options.Endpoint =
								new Uri(otlpEndpoint);
						}))
			.WithMetrics(metrics =>
				metrics
					.AddAspNetCoreInstrumentation()
					.AddHttpClientInstrumentation()
					.AddRuntimeInstrumentation()
					.AddFusionCacheInstrumentation()
					.AddPrometheusExporter());

		return services;
	}
}