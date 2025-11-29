// <copyright file="ElectronicNotificationsExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.ElectronicNotifications.Emails;

namespace SeventySix.Extensions;

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
/// builder.Services.AddElectronicNotificationsDomain(builder.Configuration);
/// </code>
///
/// Registered Components:
/// - EmailSettings: Email configuration from appsettings.json
/// - IEmailService → EmailService: Email notification service using MailKit.
/// </remarks>
public static class ElectronicNotificationsExtensions
{
	/// <summary>
	/// Registers ElectronicNotifications bounded context services with the dependency injection container.
	/// </summary>
	/// <param name="services">The service collection to register services with.</param>
	/// <param name="configuration">The application configuration.</param>
	/// <returns>The service collection for method chaining.</returns>
	/// <remarks>
	/// Service Lifetimes:
	/// - EmailSettings: Singleton (bound from configuration)
	/// - EmailService: Scoped (creates new SMTP connection per request).
	/// </remarks>
	public static IServiceCollection AddElectronicNotificationsDomain(
		this IServiceCollection services,
		IConfiguration configuration)
	{
		// Bind email settings from configuration
		services.Configure<EmailSettings>(
			configuration.GetSection("Email"));

		// Register email service
		services.AddScoped<IEmailService, EmailService>();

		return services;
	}
}