// <copyright file="EcommerceCleanupRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.EcommerceCleanup.Repositories;
using SeventySix.EcommerceCleanup.Settings;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.Shared.Registration;

namespace SeventySix.EcommerceCleanup.Registration;

/// <summary>
/// Registers EcommerceCleanup domain services, settings, and job contributors.
/// </summary>
public static class EcommerceCleanupRegistration
{
	/// <summary>
	/// Adds the EcommerceCleanup domain to the service collection.
	/// Registers settings validation, repository, and job scheduling contributor.
	/// </summary>
	/// <param name="services">
	/// The service collection to register services with.
	/// </param>
	/// <param name="configuration">
	/// The application configuration for binding settings.
	/// </param>
	/// <returns>
	/// The service collection for method chaining.
	/// </returns>
	public static IServiceCollection AddEcommerceCleanupDomain(
		this IServiceCollection services,
		IConfiguration configuration)
	{
		services.AddSingleton<IValidator<EcommerceCleanupSettings>, EcommerceCleanupSettingsValidator>();

		services
			.AddOptions<EcommerceCleanupSettings>()
			.Bind(configuration.GetSection(EcommerceCleanupSettings.SectionName))
			.ValidateWithFluentValidation()
			.ValidateOnStart();

		services.AddScoped<IEcommerceCleanupRepository, EcommerceCleanupRepository>();
		services.AddScoped<IJobSchedulerContributor, EcommerceCleanupJobSchedulerContributor>();

		return services;
	}
}