// <copyright file="JaegerHealthCheck.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net.Sockets;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace SeventySix.Api.HealthChecks;

/// <summary>
/// Health check for Jaeger OTLP endpoint connectivity.
/// Verifies that the Jaeger collector is reachable on the configured OTLP endpoint.
/// </summary>
/// <remarks>
/// This check is marked as Degraded (not Unhealthy) on failure because tracing
/// is an observability concern and should not prevent the application from serving traffic.
/// The app can continue to function without tracing, but telemetry data will be lost.
/// </remarks>
/// <param name="configuration">Application configuration.</param>
/// <param name="logger">Logger instance.</param>
public class JaegerHealthCheck(IConfiguration configuration, ILogger<JaegerHealthCheck> logger) : IHealthCheck
{
	/// <summary>
	/// Checks the health of the Jaeger OTLP endpoint.
	/// </summary>
	/// <param name="context">Health check context.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Health check result indicating endpoint reachability.</returns>
	public async Task<HealthCheckResult> CheckHealthAsync(
		HealthCheckContext context,
		CancellationToken cancellationToken = default)
	{
		try
		{
			string otlpEndpoint = configuration.GetValue<string>("OpenTelemetry:OtlpEndpoint")
				?? "http://localhost:4317";

			Uri uri = new Uri(otlpEndpoint);
			string host = uri.Host;
			int port = uri.Port;

			// Test TCP connectivity to Jaeger OTLP endpoint
			using TcpClient tcpClient = new TcpClient();
			Task connectTask = tcpClient.ConnectAsync(host, port, cancellationToken).AsTask();
			Task timeoutTask = Task.Delay(TimeSpan.FromSeconds(3), cancellationToken);

			Task completedTask = await Task.WhenAny(connectTask, timeoutTask);

			if (completedTask == timeoutTask)
			{
				logger.LogWarning("Jaeger health check timeout connecting to {Endpoint}", otlpEndpoint);
				return HealthCheckResult.Degraded(
					description: $"Timeout connecting to Jaeger at {otlpEndpoint}",
					data: new Dictionary<string, object>
					{
						{ "endpoint", otlpEndpoint },
						{ "host", host },
						{ "port", port },
					});
			}

			if (tcpClient.Connected)
			{
				return HealthCheckResult.Healthy(
					description: $"Jaeger OTLP endpoint reachable at {otlpEndpoint}",
					data: new Dictionary<string, object>
					{
						{ "endpoint", otlpEndpoint },
						{ "host", host },
						{ "port", port },
					});
			}

			logger.LogWarning("Jaeger health check failed to connect to {Endpoint}", otlpEndpoint);
			return HealthCheckResult.Degraded(
				description: $"Cannot connect to Jaeger at {otlpEndpoint}",
				data: new Dictionary<string, object>
				{
					{ "endpoint", otlpEndpoint },
					{ "host", host },
					{ "port", port },
				});
		}
		catch (Exception ex)
		{
			logger.LogWarning(ex, "Jaeger health check error");
			return HealthCheckResult.Degraded(
				description: $"Error checking Jaeger connectivity: {ex.Message}",
				exception: ex);
		}
	}
}