// <copyright file="SharedWebApplicationFactory.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using SeventySix.ApiTracking;
using SeventySix.Identity;
using SeventySix.Logging;

namespace SeventySix.TestUtilities.TestBases;

/// <summary>
/// A shared WebApplicationFactory that can be reused across multiple tests in the same collection.
/// Reduces test execution time by avoiding repeated factory creation and disposal overhead.
/// </summary>
/// <typeparam name="TProgram">The entry point type for the application.</typeparam>
public sealed class SharedWebApplicationFactory<TProgram>
	: WebApplicationFactory<TProgram>
	where TProgram : class
{
	private readonly string ConnectionString;
	private readonly Action<IWebHostBuilder>? ConfigureAdditional;

	/// <summary>
	/// Initializes a new instance of the <see cref="SharedWebApplicationFactory{TProgram}"/> class.
	/// </summary>
	/// <param name="connectionString">The PostgreSQL connection string to use for DbContexts.</param>
	/// <param name="configureAdditional">Optional additional configuration for the web host builder.</param>
	public SharedWebApplicationFactory(
		string connectionString,
		Action<IWebHostBuilder>? configureAdditional = null)
	{
		ConnectionString = connectionString;
		ConfigureAdditional = configureAdditional;
	}

	/// <inheritdoc/>
	protected override void ConfigureWebHost(
		Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
	{
		// Set environment to Test - this triggers:
		// - Silent logging in SerilogExtensions (Error+ only, no sinks)
		// - Disabled OpenTelemetry, HealthChecks, BackgroundJobs, ResponseCompression
		builder.UseEnvironment("Test");

		// Skip migration checks in tests - fixture already applies migrations
		builder.ConfigureAppConfiguration(
			(context, config) =>
			{
				config.AddInMemoryCollection(
					new Dictionary<string, string?>
					{
						["SkipMigrationCheck"] = "true",
					});
			});

		// Suppress Microsoft.Extensions.Logging providers (fallback logging)
		builder.ConfigureLogging(logging =>
		{
			logging.ClearProviders();
			logging.SetMinimumLevel(LogLevel.Error);
		});

		builder.ConfigureServices(services =>
		{
			// Replace DbContexts with test database connection string
			services.RemoveAll<DbContextOptions<IdentityDbContext>>();
			services.RemoveAll<DbContextOptions<LoggingDbContext>>();
			services.RemoveAll<DbContextOptions<ApiTrackingDbContext>>();

			services.AddDbContext<IdentityDbContext>(options =>
				options.UseNpgsql(ConnectionString));
			services.AddDbContext<LoggingDbContext>(options =>
				options.UseNpgsql(ConnectionString));
			services.AddDbContext<ApiTrackingDbContext>(options =>
				options.UseNpgsql(ConnectionString));
		});

		// Apply any additional configuration LAST (e.g., for rate limiting tests)
		// Configuration from AddInMemoryCollection calls here will override appsettings.Test.json
		ConfigureAdditional?.Invoke(builder);
	}
}
