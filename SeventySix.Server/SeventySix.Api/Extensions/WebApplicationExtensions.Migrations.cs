// <copyright file="WebApplicationExtensions.Migrations.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Data.Common;
using System.Text;
using Microsoft.EntityFrameworkCore;
using SeventySix.ApiTracking;
using SeventySix.ElectronicNotifications;
using SeventySix.Identity;
using SeventySix.Logging;
using SeventySix.Shared.Exceptions;

namespace SeventySix.Api.Extensions;

/// <summary>
/// Migration-related pipeline extensions. Applies pending EF Core migrations
/// for each bounded context on startup and emits actionable diagnostics when
/// migration fails.
/// </summary>
public static partial class WebApplicationExtensions
{
	/// <summary>Applies pending database migrations for all bounded contexts.</summary>
	/// <remarks>
	/// Reads configuration key: "SkipMigrationCheck" (bool) — when true, migration checks are skipped (useful in CI or short-lived containers).
	/// Applies migrations for contexts: Identity, Logging, ApiTracking, ElectronicNotifications.
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
		catch (DbException exception)
		{
			logger.LogCritical(
				exception,
				"DATABASE MIGRATION FAILED - Application cannot start");

			WriteConsoleErrorBanner(exception);

			if (System.Diagnostics.Debugger.IsAttached)
			{
				throw new StartupFailedException(
					StartupFailedReason.DatabaseMigration,
					BuildMigrationErrorMessage(exception),
					exception);
			}

			Environment.Exit(1);
		}
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
	/// Writes a formatted error banner to <see cref="Console.Error"/> and to
	/// the Debug Output when a debugger is attached.
	/// </summary>
	/// <param name="exception">
	/// The exception to display.
	/// </param>
	internal static void WriteConsoleErrorBanner(Exception exception)
	{
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
}