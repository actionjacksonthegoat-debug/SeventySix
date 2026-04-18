// <copyright file="WebApplicationExtensions.HealthChecks.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text.Json;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using SeventySix.Shared.Constants;

namespace SeventySix.Api.Extensions;

/// <summary>
/// Pipeline extensions that map liveness, readiness, and aggregate
/// health-check endpoints following Kubernetes probe conventions.
/// </summary>
public static partial class WebApplicationExtensions
{
	/// <summary>Maps health check endpoints following Kubernetes best practices.</summary>
	/// <param name="app">
	/// The web application.
	/// </param>
	/// <returns>
	/// The web application for chaining.
	/// </returns>
	public static WebApplication MapHealthCheckEndpoints(
		this WebApplication app)
	{
		app.MapHealthChecks(
			EndpointPathConstants.Health.Live,
			new HealthCheckOptions
			{
				Predicate =
					_ => false,
				ResponseWriter =
					WriteLivenessResponseAsync,
			});

		app.MapHealthChecks(
			EndpointPathConstants.Health.Ready,
			new HealthCheckOptions
			{
				Predicate =
					check => check.Tags.Contains("ready"),
				ResponseWriter =
					WriteHealthCheckResponseAsync,
			});

		app.MapHealthChecks(
			EndpointPathConstants.Health.Base,
			new HealthCheckOptions
			{
				ResponseWriter =
					WriteHealthCheckResponseAsync,
			});

		return app;
	}

	/// <summary>
	/// Writes a minimal liveness JSON response for the liveness probe.
	/// </summary>
	/// <param name="context">
	/// The HTTP context.
	/// </param>
	/// <param name="_">
	/// The health report (ignored for liveness endpoint).
	/// </param>
	/// <returns>
	/// A task that completes when the response is written.
	/// </returns>
	private static async Task WriteLivenessResponseAsync(
		HttpContext context,
		HealthReport _)
	{
		context.Response.ContentType = MediaTypeConstants.Json;

		TimeProvider timeProvider =
			context.RequestServices.GetRequiredService<TimeProvider>();

		await context.Response.WriteAsJsonAsync(
			new
			{
				status = HealthStatusConstants.Healthy,
				timestamp = timeProvider.GetUtcNow(),
			});
	}

	/// <summary>
	/// Writes a detailed health JSON response including entries, durations, and metadata.
	/// </summary>
	/// <param name="context">
	/// The HTTP context.
	/// </param>
	/// <param name="report">
	/// The aggregated health report returned by the health checks subsystem.
	/// </param>
	/// <returns>
	/// A task that completes when the response is written.
	/// </returns>
	private static async Task WriteHealthCheckResponseAsync(
		HttpContext context,
		HealthReport report)
	{
		context.Response.ContentType = MediaTypeConstants.Json;

		TimeProvider timeProvider =
			context.RequestServices.GetRequiredService<TimeProvider>();

		object response =
			new
			{
				status = report.Status.ToString(),
				timestamp = timeProvider.GetUtcNow(),
				duration = report.TotalDuration,
				checks = report.Entries.Select(entry =>
					new
					{
						name = entry.Key,
						status = entry.Value.Status.ToString(),
						description = entry.Value.Description,
						duration = entry.Value.Duration,
						exception = entry.Value.Exception?.Message,
						data = entry.Value.Data,
					}),
			};

		string result =
			JsonSerializer.Serialize(
				response,
				new JsonSerializerOptions { WriteIndented = true });

		await context.Response.WriteAsync(result);
	}
}