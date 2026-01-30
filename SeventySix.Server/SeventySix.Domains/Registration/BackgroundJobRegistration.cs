// <copyright file="BackgroundJobRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Logging;
using SeventySix.Logging.Jobs;
using SeventySix.Shared.BackgroundJobs;

namespace SeventySix.Registration;

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
///   <item><see cref="ElectronicNotifications.Emails.Jobs.EmailQueueProcessJob"/> - Periodic processing of email queue (ElectronicNotifications)</item>
///   <item><see cref="Logging.Jobs.LogCleanupJob"/> - Periodic cleanup of old log files and database entries (Logging)</item>
///   <item><see cref="Logging.Jobs.DatabaseMaintenanceJob"/> - Nightly PostgreSQL VACUUM ANALYZE for all schemas (Logging)</item>
/// </list>
///
/// <para><strong>Note:</strong> Identity background jobs are registered via <c>IdentityRegistration.AddIdentityDomain()</c>:</para>
/// <list type="bullet">
///   <item>RefreshTokenCleanupJob - Periodic cleanup of expired refresh tokens</item>
///   <item>IpAnonymizationJob - Periodic anonymization of old IP addresses for GDPR compliance</item>
///   <item>AdminSeederService - One-time admin user seeding at startup</item>
/// </list>
///
/// <para><strong>Usage in Program.cs:</strong></para>
/// <code>
/// builder.Services.AddBackgroundJobs(builder.Configuration);
/// </code>
/// </remarks>
public static class BackgroundJobRegistration
{
	/// <summary>
	/// Registers all background jobs with their settings from configuration.
	/// </summary>
	/// <param name="services">
	/// The service collection to register background jobs with.
	/// </param>
	/// <param name="configuration">
	/// The application configuration for binding settings.
	/// </param>
	/// <returns>
	/// The service collection for method chaining.
	/// </returns>
	public static IServiceCollection AddBackgroundJobs(
		this IServiceCollection services,
		IConfiguration configuration)
	{
		// Always register recurring job repository (needed for ScheduledJobService)
		// This is read-only infrastructure, independent of whether jobs run
		services.AddScoped<IRecurringJobRepository, RecurringJobRepository>();

		// Always register settings (needed for ScheduledJobService health status calculation)
		// Note: Identity-related settings (RefreshTokenCleanup, IpAnonymization) are registered
		// via IdentityRegistration.AddIdentityDomain()
		services.Configure<LogCleanupSettings>(
			configuration.GetSection(LogCleanupSettings.SectionName));
		services.Configure<DatabaseMaintenanceSettings>(
			configuration.GetSection(DatabaseMaintenanceSettings.SectionName));
		services.Configure<EmailQueueSettings>(
			configuration.GetSection(EmailQueueSettings.SectionName));

		// Skip background job execution if disabled (e.g., in Test environment)
		bool enabled =
			configuration.GetValue<bool?>("BackgroundJobs:Enabled") ?? true;
		if (!enabled)
		{
			return services;
		}

		// Core recurring job infrastructure for job execution
		services.AddScoped<IMessageScheduler, WolverineMessageScheduler>();
		services.AddScoped<IRecurringJobService, RecurringJobService>();

		// Database maintenance service
		services.AddScoped<IDatabaseMaintenanceService, DatabaseMaintenanceService>();

		// Note: AdminSeederService (one-time admin user seeding) is registered
		// via IdentityRegistration.AddIdentityDomain()

		// Recurring job scheduler - schedules all jobs on startup
		services.AddHostedService<RecurringJobSchedulerService>();

		return services;
	}
}