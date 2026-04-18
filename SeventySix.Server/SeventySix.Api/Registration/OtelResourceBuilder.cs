// <copyright file="OtelResourceBuilder.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using OpenTelemetry.Resources;

namespace SeventySix.Api.Registration;

/// <summary>
/// Configures a canonical OpenTelemetry <see cref="ResourceBuilder"/> with
/// <c>service.name</c>, <c>service.namespace</c>,
/// <c>service.instance.id</c>, and <c>deployment.environment</c>.
/// </summary>
/// <remarks>
/// Centralises resource attributes so that traces, metrics, and logs
/// emitted by the .NET host carry a uniform identity.
/// </remarks>
public static class OtelResourceBuilder
{
	/// <summary>
	/// The OpenTelemetry namespace shared by all SeventySix services.
	/// </summary>
	private const string ServiceNamespace = "seventysix";

	/// <summary>
	/// Configures the supplied <paramref name="builder"/> with the
	/// standard SeventySix resource attributes.
	/// </summary>
	/// <param name="builder">
	/// The resource builder to configure (provided by the OpenTelemetry SDK).
	/// </param>
	/// <param name="serviceName">
	/// Logical service name (e.g. <c>seventysix-api</c>).
	/// </param>
	/// <param name="serviceVersion">
	/// Semantic version of the running service.
	/// </param>
	/// <param name="environment">
	/// Deployment environment name (e.g. <c>Development</c>, <c>Production</c>).
	/// </param>
	/// <returns>
	/// The same <paramref name="builder"/> for chaining.
	/// </returns>
	public static ResourceBuilder Configure(
		ResourceBuilder builder,
		string serviceName,
		string serviceVersion,
		string environment)
	{
		return builder
			.AddService(
				serviceName: serviceName,
				serviceVersion: serviceVersion,
				serviceNamespace: ServiceNamespace,
				serviceInstanceId: Environment.MachineName)
			.AddAttributes(
				new Dictionary<string, object>
				{
					["deployment.environment"] = environment,
				});
	}
}
