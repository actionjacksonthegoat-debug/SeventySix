// <copyright file="WebApplicationExtensions.Dependencies.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Sockets;
using SeventySix.Api.Configuration;
using SeventySix.Shared.Exceptions;

namespace SeventySix.Api.Extensions;

/// <summary>
/// Startup dependency validation extensions — verifies that required
/// external services (e.g., PostgreSQL) are reachable before the pipeline
/// is configured.
/// </summary>
public static partial class WebApplicationExtensions
{
	/// <summary>
	/// Validates that required dependencies (database) are available before
	/// startup when running under an attached debugger.
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
			return;
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
					+ "Configure Database settings in User Secrets: "
					+ "dotnet user-secrets set \"Database:Password\" \"your-password\" --project SeventySix.Api");
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
					+ "Alternatively, run: docker compose up -d postgres";

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
		catch (SocketException)
		{
			return false;
		}
		catch (OperationCanceledException)
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