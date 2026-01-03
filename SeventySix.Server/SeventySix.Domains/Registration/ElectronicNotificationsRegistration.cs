// <copyright file="ElectronicNotificationsRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.ElectronicNotifications;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Persistence;

namespace SeventySix.Registration;

/// <summary>
/// Dependency injection extension methods for the ElectronicNotifications bounded context.
/// Registers all services for email and other notification channels.
/// </summary>
/// <remarks>
/// This class follows the Extension Method pattern for clean service registration.
/// It encapsulates all ElectronicNotifications-related dependency injection configuration.
///
/// Usage in Program.cs:
/// <code>
/// builder.Services.AddElectronicNotificationsDomain(connectionString, builder.Configuration);
/// </code>
///
/// Registered Components:
/// - ElectronicNotificationsDbContext: Database context for email queue
/// - EmailSettings: Email configuration from appsettings.json
/// - EmailQueueSettings: Queue processor configuration
/// - IEmailService → EmailService: Email notification service using MailKit.
/// </remarks>
public static class ElectronicNotificationsRegistration
{
	/// <summary>
	/// Registers ElectronicNotifications bounded context services with the dependency injection container.
	/// </summary>
	/// <param name="services">
	/// The service collection to register services with.
	/// </param>
	/// <param name="connectionString">
	/// The database connection string for ElectronicNotificationsDbContext.
	/// </param>
	/// <param name="configuration">
	/// The application configuration.
	/// </param>
	/// <returns>
	/// The service collection for method chaining.
	/// </returns>
	/// <remarks>
	/// Service Lifetimes:
	/// - EmailSettings: Singleton (bound from configuration)
	/// - EmailQueueSettings: Singleton (bound from configuration)
	/// - ElectronicNotificationsDbContext: Scoped (EF Core convention)
	/// - EmailService: Scoped (creates new SMTP connection per request).
	/// </remarks>
	public static IServiceCollection AddElectronicNotificationsDomain(
		this IServiceCollection services,
		string connectionString,
		IConfiguration configuration)
	{
		// Register DbContext with PostgreSQL
		services.AddDbContext<ElectronicNotificationsDbContext>(
			(serviceProvider, options) =>
			{
				AuditInterceptor auditInterceptor =
					serviceProvider.GetRequiredService<AuditInterceptor>();

				options.UseNpgsql(
					connectionString,
					npgsqlOptions =>
						npgsqlOptions.MigrationsHistoryTable(
							DatabaseConstants.MigrationsHistoryTableName,
							SchemaConstants.ElectronicNotifications));
				options.AddInterceptors(auditInterceptor);
			});

		// Bind email settings from configuration
		services.Configure<EmailSettings>(configuration.GetSection("Email"));

		// Bind email queue settings
		services.Configure<EmailQueueSettings>(
			configuration.GetSection(EmailQueueSettings.SectionName));

		// Register email service
		services.AddScoped<IEmailService, EmailService>();

		return services;
	}
}