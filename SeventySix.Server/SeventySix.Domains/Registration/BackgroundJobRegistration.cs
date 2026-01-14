// <copyright file="BackgroundJobRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Identity;
using SeventySix.Identity.Settings;
using SeventySix.Logging;
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
///   <item><see cref="Identity.Jobs.RefreshTokenCleanupJob"/> - Periodic cleanup of expired refresh tokens (Identity)</item>
///   <item><see cref="Identity.Jobs.IpAnonymizationJob"/> - Periodic anonymization of old IP addresses for GDPR compliance (Identity)</item>
///   <item><see cref="AdminSeederService"/> - One-time admin user seeding at startup (Identity)</item>
///   <item><see cref="ElectronicNotifications.Emails.Jobs.EmailQueueProcessJob"/> - Periodic processing of email queue (ElectronicNotifications)</item>
///   <item><see cref="Logging.Jobs.LogCleanupJob"/> - Periodic cleanup of old log files and database entries (Logging)</item>
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
		// Skip all background jobs if disabled (e.g., in Test environment)
		bool enabled =
			configuration.GetValue<bool?>("BackgroundJobs:Enabled") ?? true;
		if (!enabled)
		{
			return services;
		}

		// Core recurring job infrastructure
		services.AddScoped<IMessageScheduler, WolverineMessageScheduler>();
		services.AddScoped<IRecurringJobRepository, RecurringJobRepository>();
		services.AddScoped<IRecurringJobService, RecurringJobService>();

		// Settings for recurring jobs
		services.Configure<RefreshTokenCleanupSettings>(
			configuration.GetSection(RefreshTokenCleanupSettings.SectionName));
		services.Configure<IpAnonymizationSettings>(
			configuration.GetSection(IpAnonymizationSettings.SectionName));
		services.Configure<LogCleanupSettings>(
			configuration.GetSection(LogCleanupSettings.SectionName));
		services.Configure<EmailQueueSettings>(
			configuration.GetSection(EmailQueueSettings.SectionName));

		// AdminSeederService - One-time admin user seeding at startup (remains as IHostedService)
		services.Configure<AdminSeederSettings>(
			configuration.GetSection(AdminSeederSettings.SectionName));
		services.AddHostedService<AdminSeederService>();

		// Recurring job scheduler - schedules all jobs on startup
		services.AddHostedService<RecurringJobSchedulerService>();

		return services;
	}
}