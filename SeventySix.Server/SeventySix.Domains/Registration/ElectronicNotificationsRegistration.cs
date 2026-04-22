// <copyright file="ElectronicNotificationsRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.ElectronicNotifications;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.ElectronicNotifications.Emails.Jobs;
using SeventySix.ElectronicNotifications.Emails.Services;
using SeventySix.ElectronicNotifications.Emails.Strategies;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Registration;

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
/// - IEmailService → EmailService: Email notification service using Brevo HTTP API.
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
	/// - EmailService: Scoped (uses IHttpClientFactory for Brevo API calls).
	/// </remarks>
	public static IServiceCollection AddElectronicNotificationsDomain(
		this IServiceCollection services,
		string connectionString,
		IConfiguration configuration)
	{
		// Register ElectronicNotificationsDbContext via shared helper
		services.AddDomainDbContext<ElectronicNotificationsDbContext>(
			connectionString,
			SchemaConstants.ElectronicNotifications);

		// Bind email settings with FluentValidation + ValidateOnStart
		services.AddDomainSettings<EmailSettings, EmailSettingsValidator>(
			configuration,
			EmailSettings.SectionName);

		// Bind email queue settings with FluentValidation + ValidateOnStart
		services.AddDomainSettings<EmailQueueSettings, EmailQueueSettingsValidator>(
			configuration,
			EmailQueueSettings.SectionName);

		// Bind email queue retention settings with FluentValidation + ValidateOnStart
		services.AddDomainSettings<EmailQueueRetentionSettings, EmailQueueRetentionSettingsValidator>(
			configuration,
			EmailQueueRetentionSettings.SectionName);

		// Register named HttpClient for Brevo API — read from bound EmailSettings
		// to ensure single source of truth for ApiUrl/ApiKey defaults
		EmailSettings emailSettings =
			configuration
				.GetSection(EmailSettings.SectionName)
				.Get<EmailSettings>()!;

		services
			.AddHttpClient(
				EmailService.BrevoHttpClientName,
				httpClient =>
				{
					httpClient.BaseAddress =
						new Uri(emailSettings.ApiUrl);
					httpClient.DefaultRequestHeaders.Add(
						"api-key",
						emailSettings.ApiKey);
					httpClient.DefaultRequestHeaders.Add(
						"Accept",
						"application/json");
					httpClient.Timeout =
					TimeSpan.FromSeconds(30);
				});

		// Register transaction manager for notifications context
		services.AddTransactionManagerFor<ElectronicNotificationsDbContext>();

		// Register email service
		services.AddScoped<IEmailService, EmailService>();

		// Register email sending strategies (OCP — one strategy per email type)
		services.AddScoped<IEmailSendingStrategy, WelcomeEmailStrategy>();
		services.AddScoped<IEmailSendingStrategy, PasswordResetEmailStrategy>();
		services.AddScoped<IEmailSendingStrategy, VerificationEmailStrategy>();
		services.AddScoped<IEmailSendingStrategy, MfaCodeEmailStrategy>();
		services.AddScoped<EmailSendingStrategyResolver>();

		// Register ElectronicNotifications domain job scheduler contributor
		services.AddScoped<IJobSchedulerContributor, EmailQueueJobSchedulerContributor>();

		return services;
	}
}