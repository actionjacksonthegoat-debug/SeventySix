// <copyright file="SerilogExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Serilog;
using Serilog.Events;
using Serilog.Exceptions;
using SeventySix.Api.Logging;

namespace SeventySix.Api.Extensions;

/// <summary>
/// Extension methods for Serilog configuration.
/// Centralizes Serilog setup to avoid duplication (DRY principle).
/// </summary>
public static class SerilogExtensions
{
	private const string ConsoleOutputTemplate =
		"[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}";

	private const string FileOutputTemplate =
		"{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {SourceContext} {Message:lj} {Properties:j}{NewLine}{Exception}";

	private const string LogFilePath = "logs/seventysix-.txt";
	private const int RetainedFileCount = 30;

	/// <summary>
	/// Configures base Serilog settings (enrichers, console, file sinks).
	/// Use before app.Build() when database sink is not yet available.
	/// In Test environment, configures silent logging (Error+ only, no sinks).
	/// </summary>
	/// <param name="config">The logger configuration.</param>
	/// <param name="configuration">The application configuration.</param>
	/// <param name="environment">The environment name (defaults to Production).</param>
	/// <returns>The configured logger configuration.</returns>
	public static LoggerConfiguration ConfigureBaseSerilog(
		this LoggerConfiguration config,
		IConfiguration configuration,
		string? environment = null)
	{
		// In Test environment, suppress all logging below Error to eliminate noise
		if (string.Equals(environment, "Test", StringComparison.OrdinalIgnoreCase))
		{
			return config
				.MinimumLevel.Error()
				.MinimumLevel.Override("Microsoft", LogEventLevel.Fatal)
				.MinimumLevel.Override("System", LogEventLevel.Fatal)
				.MinimumLevel.Override("Wolverine", LogEventLevel.Fatal)
				.MinimumLevel.Override("JasperFx", LogEventLevel.Fatal);
			// No sinks in Test - avoids console/file I/O overhead
		}

		return config
			.ReadFrom.Configuration(configuration)
			.ConfigureEnrichers()
			.ConfigureConsoleSink()
			.ConfigureFileSink()
			.ConfigureMinimumLevels();
	}

	/// <summary>
	/// Reconfigures Serilog with database sink after app.Build().
	/// This allows resolving scoped services (DbContext) for logging.
	/// </summary>
	/// <param name="configuration">The application configuration.</param>
	/// <param name="serviceProvider">The service provider for resolving dependencies.</param>
	/// <param name="environment">The current environment name.</param>
	public static void ReconfigureWithDatabaseSink(
		IConfiguration configuration,
		IServiceProvider serviceProvider,
		string environment)
	{
		// Skip database sink in Test environment - tests control their own logging
		if (string.Equals(environment, "Test", StringComparison.OrdinalIgnoreCase))
		{
			return;
		}

		Serilog.Log.Logger = new LoggerConfiguration()
			.ReadFrom.Configuration(configuration)
			.ConfigureEnrichers()
			.ConfigureConsoleSink()
			.ConfigureFileSink()
			.WriteTo.Database(
				serviceProvider: serviceProvider,
				environment: environment,
				machineName: Environment.MachineName)
			.ConfigureMinimumLevels()
			.CreateLogger();
	}

	private static LoggerConfiguration ConfigureEnrichers(this LoggerConfiguration config)
	{
		return config
			.Enrich.FromLogContext()
			.Enrich.WithMachineName()
			.Enrich.WithThreadId()
			.Enrich.WithExceptionDetails();
	}

	private static LoggerConfiguration ConfigureConsoleSink(this LoggerConfiguration config)
	{
		return config.WriteTo.Console(outputTemplate: ConsoleOutputTemplate);
	}

	private static LoggerConfiguration ConfigureFileSink(this LoggerConfiguration config)
	{
		return config.WriteTo.File(
			path: LogFilePath,
			rollingInterval: RollingInterval.Day,
			retainedFileCountLimit: RetainedFileCount,
			outputTemplate: FileOutputTemplate);
	}

	private static LoggerConfiguration ConfigureMinimumLevels(this LoggerConfiguration config)
	{
		// NOTE: MinimumLevel.Default is controlled by appsettings.json via ReadFrom.Configuration()
		// Only set overrides here for framework namespaces that are too verbose at default levels
		return config
			.MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
			.MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
			.MinimumLevel.Override("System", LogEventLevel.Warning);
	}
}