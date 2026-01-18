// <copyright file="WebApplicationExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using SeventySix.Api.Configuration;
using SeventySix.Api.Infrastructure;
using SeventySix.ApiTracking;
using SeventySix.ElectronicNotifications;
using SeventySix.Identity;
using SeventySix.Logging;
using SeventySix.Shared.Constants;

namespace SeventySix.Api.Extensions;

/// <summary>Extension methods for WebApplication pipeline configuration.</summary>
public static class WebApplicationExtensions
{
	/// <summary>Applies pending database migrations for all bounded contexts.</summary>
	/// <remarks>
	/// Reads configuration key: "SkipMigrationCheck" (bool) — when true, migration checks are skipped (useful in CI or short-lived containers).
	/// Applies migrations for contexts: Identity, Logging, ApiTracking.
	/// </remarks>
	/// <param name="app">
	/// The web application.
	/// </param>
	/// <param name="configuration">
	/// The application configuration.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	public static async Task ApplyMigrationsAsync(
		this WebApplication app,
		IConfiguration configuration)
	{
		bool skipMigrationCheck =
			configuration.GetValue<bool>(
				"SkipMigrationCheck");

		if (skipMigrationCheck)
		{
			return;
		}

		using IServiceScope scope = app.Services.CreateScope();

		IServiceProvider services = scope.ServiceProvider;

		ILogger logger =
			services.GetRequiredService<ILogger<WebApplication>>();

		try
		{
			logger.LogInformation(
				"Checking for pending database migrations...");

			await ApplyContextMigrationsAsync<IdentityDbContext>(
				services,
				logger,
				"Identity");

			await ApplyContextMigrationsAsync<LoggingDbContext>(
				services,
				logger,
				"Logging");

			await ApplyContextMigrationsAsync<ApiTrackingDbContext>(
				services,
				logger,
				"ApiTracking");

			await ApplyContextMigrationsAsync<ElectronicNotificationsDbContext>(
				services,
				logger,
				"ElectronicNotifications");

			logger.LogInformation(
				"Database initialization completed successfully");
		}
		catch (Exception exception)
		{
			logger.LogCritical(
				exception,
				"DATABASE MIGRATION FAILED - Application cannot start");

			// Write to console and debug output for visibility across environments
			WriteConsoleErrorBanner(exception);

			// When running under an attached debugger, throw a typed exception
			// so the debugger breaks and the Exception Helper shows full context.
			if (System.Diagnostics.Debugger.IsAttached)
			{
				throw new StartupFailedException(
					StartupFailedReason.DatabaseMigration,
					BuildMigrationErrorMessage(exception),
					exception);
			}

			// Exit with error code to signal container failure
			Environment.Exit(1);
		}
	}

	/// <summary>
	/// Truncates a string to fit within display constraints, adding ellipsis if needed.
	/// </summary>
	/// <param name="value">
	/// The string to truncate.
	/// </param>
	/// <param name="maxLength">
	/// Maximum allowed length.
	/// </param>
	/// <returns>
	/// Truncated string with ellipsis if original exceeded maxLength.
	/// </returns>
	private static string TruncateForDisplay(
		string value,
		int maxLength)
	{
		if (string.IsNullOrEmpty(value))
		{
			return string.Empty;
		}

		// Replace newlines with spaces for single-line display
		string singleLine =
			value
				.Replace("\r\n", " ")
				.Replace("\n", " ")
				.Replace("\r", " ");

		if (singleLine.Length <= maxLength)
		{
			return singleLine;
		}

		return string.Concat(
			singleLine.AsSpan(
				0,
				maxLength - 3),
			"...");
	}

	/// <summary>
	/// Builds a human-friendly migration error message with suggested remediation steps.
	/// </summary>
	/// <param name="exception">
	/// The original <see cref="Exception"/> encountered during migration.
	/// </param>
	/// <returns>
	/// A multi-line string containing the short error and suggested fixes suitable for display in console output.
	/// </returns>
	internal static string BuildMigrationErrorMessage(Exception exception)
	{
		StringBuilder messageBuilder = new();

		messageBuilder.AppendLine("DATABASE MIGRATION FAILED");
		messageBuilder.AppendLine();
		messageBuilder.AppendLine($"Error: {exception.Message}");

		if (exception.InnerException != null)
		{
			messageBuilder.AppendLine(
				$"Inner: {exception.InnerException.Message}");
		}

		messageBuilder.AppendLine();
		messageBuilder.AppendLine("Common causes:");
		messageBuilder.AppendLine("  - Table already exists (schema conflict)");
		messageBuilder.AppendLine(
			"  - Database not empty but migrations expect clean state");
		messageBuilder.AppendLine(
			"  - Migration history out of sync with actual schema");
		messageBuilder.AppendLine();
		messageBuilder.AppendLine("Suggested fixes:");
		messageBuilder.AppendLine("  1. Run: npm run stop");
		messageBuilder.AppendLine(
			"  2. Run: docker volume rm seventysix_postgres_data");
		messageBuilder.AppendLine("  3. Run: npm run start");

		return messageBuilder.ToString();
	}

	/// <summary>
	/// Writes a formatted error banner to <see cref="Console.Error"/> and to the Debug Output when
	/// a debugger is attached. Uses <see cref="TruncateForDisplay"/> to produce concise output.
	/// </summary>
	/// <param name="exception">
	/// The exception to display.
	/// </param>
	internal static void WriteConsoleErrorBanner(Exception exception)
	{
		// Standard console output for npm/Docker
		Console.Error.WriteLine();
		Console.Error.WriteLine(
			"====================================================================");
		Console.Error.WriteLine(
			"                   DATABASE MIGRATION FAILED                        ");
		Console.Error.WriteLine(
			"====================================================================");
		Console.Error.WriteLine(
			$"  Error: {TruncateForDisplay(exception.Message, 57)}");

		if (exception.InnerException != null)
		{
			Console.Error.WriteLine(
				$"  Inner: {TruncateForDisplay(exception.InnerException.Message, 57)}");
		}

		Console.Error.WriteLine(
			"--------------------------------------------------------------------");
		Console.Error.WriteLine("  Common causes:");
		Console.Error.WriteLine("    - Table already exists (schema conflict)");
		Console.Error.WriteLine(
			"    - Database not empty but migrations expect clean state");
		Console.Error.WriteLine(
			"    - Migration history out of sync with actual schema");
		Console.Error.WriteLine(
			"--------------------------------------------------------------------");
		Console.Error.WriteLine("  Suggested fixes:");
		Console.Error.WriteLine("    1. Run: npm run stop");
		Console.Error.WriteLine(
			"    2. Run: docker volume rm seventysix_postgres_data");
		Console.Error.WriteLine("    3. Run: npm run start");
		Console.Error.WriteLine(
			"====================================================================");
		Console.Error.WriteLine();

		// Additionally write to Debug output for VS Output window visibility
		if (System.Diagnostics.Debugger.IsAttached)
		{
			System.Diagnostics.Debug.WriteLine("");
			System.Diagnostics.Debug.WriteLine(
				"====================================================================");
			System.Diagnostics.Debug.WriteLine(
				"                   DATABASE MIGRATION FAILED                        ");
			System.Diagnostics.Debug.WriteLine(
				"====================================================================");
			System.Diagnostics.Debug.WriteLine($"  Error: {exception.Message}");

			if (exception.InnerException != null)
			{
				System.Diagnostics.Debug.WriteLine(
					$"  Inner: {exception.InnerException.Message}");
			}

			System.Diagnostics.Debug.WriteLine("");
			System.Diagnostics.Debug.WriteLine(
				"  Full stack trace available in Exception Helper");
			System.Diagnostics.Debug.WriteLine(
				"====================================================================");
		}
	}

	/// <summary>
	/// Validates that required dependencies (database) are available before startup when running under an
	/// attached debugger. This provides actionable guidance to developers running the API from Visual Studio.
	/// </summary>
	/// <param name="app">
	/// The web application being started.
	/// </param>
	/// <param name="configuration">
	/// The application configuration to read the connection string from.
	/// </param>
	/// <returns>
	/// A task that completes after validation; throws <see cref="StartupFailedException"/> when
	/// dependencies are not available while a debugger is attached.
	/// </returns>
	public static async Task ValidateDependenciesAsync(
		this WebApplication app,
		IConfiguration configuration)
	{
		if (!System.Diagnostics.Debugger.IsAttached)
		{
			return; // Docker/npm manages dependencies in non-debug scenarios
		}

		ILogger logger =
			app.Services.GetRequiredService<
				ILogger<WebApplication>>();

		string connectionString;
		try
		{
			connectionString =
				ConnectionStringBuilder.BuildPostgresConnectionString(
					configuration);
		}
		catch (InvalidOperationException exception)
		{
			throw new StartupFailedException(
				StartupFailedReason.Configuration,
				$"Database connection string could not be built: {exception.Message} "
					+ "Ensure .env file exists at repository root with DB_PASSWORD set, "
					+ "or configure Database:Password in user secrets.");
		}

		PostgresConnectionInfo connectionInfo =
			ParsePostgresConnectionString(
				connectionString);

		bool isAvailable =
			await CheckTcpConnectivityAsync(
				connectionInfo.Host,
				connectionInfo.Port,
				TimeSpan.FromSeconds(5));

		if (!isAvailable)
		{
			string message =
				$"PostgreSQL is not available at {connectionInfo.Host}:{connectionInfo.Port}\n\n"
					+ "Before running from Visual Studio, ensure dependencies are started:\n"
					+ "  1. Open a terminal at the repository root\n"
					+ "  2. Run: npm run start:dependencies\n"
					+ "  3. Wait for 'Dependencies ready' message\n"
					+ "  4. Then start debugging in Visual Studio\n\n"
					+ "Alternatively, run: cd SeventySix.Server && docker compose up -d postgres";

			logger.LogCritical(message);

			throw new StartupFailedException(
				StartupFailedReason.DependencyUnavailable,
				message);
		}

		logger.LogInformation(
			"Dependency validation passed: PostgreSQL available at {Host}:{Port}",
			connectionInfo.Host,
			connectionInfo.Port);
	}

	/// <summary>
	/// Attempts to open a TCP connection to the specified host and port within the given timeout.
	/// </summary>
	/// <param name="host">
	/// Hostname or IP address to connect to.
	/// </param>
	/// <param name="port">
	/// TCP port to connect to.
	/// </param>
	/// <param name="timeout">
	/// The maximum allowed duration for the connection attempt.
	/// </param>
	/// <returns>
	/// True if a connection can be established within the timeout; otherwise false.
	/// </returns>
	internal static async Task<bool> CheckTcpConnectivityAsync(
		string host,
		int port,
		TimeSpan timeout)
	{
		using TcpClient client = new();

		try
		{
			using CancellationTokenSource cancellationTokenSource =
				new(timeout);

			await client.ConnectAsync(
				host,
				port,
				cancellationTokenSource.Token);

			return true;
		}
		catch (Exception)
		{
			return false;
		}
	}

	/// <summary>
	/// Parses a Postgres connection string of the format "Host=...;Port=...;..." and extracts host and port.
	/// </summary>
	/// <param name="connectionString">
	/// The connection string to parse.
	/// </param>
	/// <returns>
	/// A <see cref="PostgresConnectionInfo"/> containing the host and port. Defaults to localhost:5432 when missing.
	/// </returns>
	internal static PostgresConnectionInfo ParsePostgresConnectionString(
		string connectionString)
	{
		Dictionary<string, string> parts =
			connectionString
				.Split(
					';',
					StringSplitOptions.RemoveEmptyEntries)
				.Select(segment => segment.Split('=', 2))
				.Where(keyValue => keyValue.Length == 2)
				.ToDictionary(
					keyValue => keyValue[0].Trim(),
					keyValue => keyValue[1].Trim(),
					StringComparer.OrdinalIgnoreCase);

		string host =
			parts.GetValueOrDefault("Host", "localhost");

		int port =
			int.TryParse(
				parts.GetValueOrDefault("Port", "5432"),
				out int parsedPort)
			? parsedPort
			: 5432;

		return new PostgresConnectionInfo(host, port);
	}

	/// <summary>Configures forwarded headers for reverse proxy scenarios.</summary>
	/// <remarks>
	/// Reads configuration section: ForwardedHeadersSettings.SectionName (known proxies, known networks, forward limit).
	/// Ensures proper IP and proto forwarding when the app is behind a reverse proxy/load balancer.
	/// </remarks>
	/// <param name="app">
	/// The web application.
	/// </param>
	/// <param name="configuration">
	/// The application configuration.
	/// </param>
	/// <returns>
	/// The web application for chaining.
	/// </returns>
	public static WebApplication UseConfiguredForwardedHeaders(
		this WebApplication app,
		IConfiguration configuration)
	{
		ForwardedHeadersSettings settings =
			configuration
				.GetSection(ForwardedHeadersSettings.SectionName)
				.Get<ForwardedHeadersSettings>()
			?? new ForwardedHeadersSettings();

		ForwardedHeadersOptions options =
			new()
			{
				ForwardedHeaders =
					ForwardedHeaders.XForwardedFor
						| ForwardedHeaders.XForwardedProto,
				ForwardLimit = settings.ForwardLimit,
			};

		foreach (string proxy in settings.KnownProxies)
		{
			if (IPAddress.TryParse(
				proxy,
				out IPAddress? ip))
			{
				options.KnownProxies.Add(ip);
			}
		}

		foreach (string network in settings.KnownNetworks)
		{
			string[] parts =
				network.Split('/');

			if (
				parts.Length == 2
				&& IPAddress.TryParse(
					parts[0],
					out IPAddress? prefix)
				&& int.TryParse(
					parts[1],
					out int prefixLength))
			{
				options.KnownIPNetworks.Add(
					new System.Net.IPNetwork(prefix, prefixLength));
			}
		}

		app.UseForwardedHeaders(options);

		return app;
	}

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
			"/health/live",
			new HealthCheckOptions
			{
				Predicate =
					_ => false,
				ResponseWriter =
					WriteLivenessResponseAsync,
			});

		app.MapHealthChecks(
			"/health/ready",
			new HealthCheckOptions
			{
				Predicate =
					check => check.Tags.Contains("ready"),
				ResponseWriter =
					WriteHealthCheckResponseAsync,
			});

		app.MapHealthChecks(
			"/health",
			new HealthCheckOptions
			{
				ResponseWriter =
					WriteHealthCheckResponseAsync,
			});

		return app;
	}

	/// <summary>
	/// Applies pending EF Core migrations for the specified <typeparamref name="TContext"/> if any exist.
	/// </summary>
	/// <typeparam name="TContext">
	/// The type of <see cref="DbContext"/> to apply migrations for.
	/// </typeparam>
	/// <param name="services">
	/// The service provider used to resolve the context instance.
	/// </param>
	/// <param name="logger">
	/// Logger used to record migration activities.
	/// </param>
	/// <param name="contextName">
	/// A friendly name for logging (e.g., "Identity").
	/// </param>
	/// <returns>
	/// A task that completes after migrations are applied (or none are pending).
	/// </returns>
	private static async Task ApplyContextMigrationsAsync<TContext>(
		IServiceProvider services,
		ILogger logger,
		string contextName)
		where TContext : DbContext
	{
		TContext context =
			services.GetRequiredService<TContext>();

		IEnumerable<string> pending =
			await context.Database.GetPendingMigrationsAsync();

		if (pending.Any())
		{
			await context.Database.MigrateAsync();
		}
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
				timestamp = timeProvider.GetUtcNow().UtcDateTime,
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
				timestamp = timeProvider.GetUtcNow().UtcDateTime,
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

/// <summary>
/// Represents the host and port information extracted from a Postgres connection string.
/// </summary>
/// <param name="Host">
/// Host name or IP address.
/// </param>
/// <param name="Port">
/// TCP port number.
/// </param>
internal record PostgresConnectionInfo(string Host, int Port);