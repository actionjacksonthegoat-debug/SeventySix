// <copyright file="BackgroundJobExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.Identity;
using SeventySix.Identity.Settings;
using SeventySix.Logging;

namespace SeventySix.Extensions;

/// <summary>
/// Central registration point for all background jobs across bounded contexts.
/// </summary>
/// <remarks>
/// <para>
/// This class provides a single place to discover and configure all background services
/// in the application, making it easy to find and manage timed services.
/// </para>
///
/// <para><strong>Background Jobs Inventory:</strong></para>
/// <list type="bullet">
///   <item><see cref="RefreshTokenCleanupJob"/> - Periodic cleanup of expired refresh tokens (Identity)</item>
///   <item><see cref="AdminSeederService"/> - One-time admin user seeding at startup (Identity)</item>
///   <item><see cref="PendingEmailBackgroundService"/> - Daily processing of pending welcome emails (Identity)</item>
///   <item><see cref="LogCleanupService"/> - Periodic cleanup of old log files and database entries (Logging)</item>
/// </list>
///
/// <para><strong>Usage in Program.cs:</strong></para>
/// <code>
/// builder.Services.AddBackgroundJobs(builder.Configuration);
/// </code>
/// </remarks>
public static class BackgroundJobExtensions
{
	/// <summary>
	/// Registers all background jobs with their settings from configuration.
	/// </summary>
	/// <param name="services">The service collection to register background jobs with.</param>
	/// <param name="configuration">The application configuration for binding settings.</param>
	/// <returns>The service collection for method chaining.</returns>
	public static IServiceCollection AddBackgroundJobs(
		this IServiceCollection services,
		IConfiguration configuration)
	{
		// RefreshTokenCleanupJob - Periodic cleanup of expired refresh tokens
		// Settings: RefreshTokenCleanup section in appsettings.json
		services.Configure<RefreshTokenCleanupSettings>(
			configuration.GetSection(
				RefreshTokenCleanupSettings.SectionName));
		services.AddHostedService<RefreshTokenCleanupJob>();

		// AdminSeederService - One-time admin user seeding at startup
		// Settings: AdminSeeder section in appsettings.json
		services.Configure<AdminSeederSettings>(
			configuration.GetSection(
				AdminSeederSettings.SectionName));
		services.AddHostedService<AdminSeederService>();

		// PendingEmailBackgroundService - Daily processing of pending welcome emails
		// Settings: Email section in appsettings.json (reuses EmailSettings)
		services.AddHostedService<PendingEmailBackgroundService>();

		// LogCleanupService - Periodic cleanup of old log files and database entries
		// Settings: Logging:Cleanup section in appsettings.json
		services.Configure<LogCleanupSettings>(
			configuration.GetSection(
				LogCleanupSettings.SectionName));
		services.AddHostedService<LogCleanupService>();

		return services;
	}
}