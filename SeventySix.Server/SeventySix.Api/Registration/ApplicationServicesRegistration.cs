// <copyright file="ApplicationServicesRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Api.Configuration;
using SeventySix.Shared.Registration;
using SeventySix.Shared.Settings;

namespace SeventySix.Api.Registration;

/// <summary>
/// Registration for application-specific services.
/// </summary>
public static class ApplicationServicesRegistration
{
	/// <summary>
	/// Adds application-specific services to the service collection.
	/// Includes configuration options, validators, and memory cache.
	/// </summary>
	/// <remarks>
	/// Reads configuration sections:
	/// - "Resilience" (via ResilienceSettings.SectionName)
	/// - "OutputCache" (via OutputCacheSettings.SectionName)
	/// - "RateLimiting" (via RateLimitingSettings.SectionName)
	/// - "RequestLimits" (via RequestLimitsSettings.SectionName)
	/// </remarks>
	/// <param name="services">
	/// The service collection.
	/// </param>
	/// <param name="configuration">
	/// The application configuration.
	/// </param>
	/// <returns>
	/// The service collection for chaining.
	/// </returns>
	public static IServiceCollection AddApplicationServices(
		this IServiceCollection services,
		IConfiguration configuration)
	{
		// Register FluentValidation validators for settings
		services.AddSingleton<IValidator<RateLimitingSettings>, RateLimitingSettingsValidator>();
		services.AddSingleton<IValidator<RequestLimitsSettings>, RequestLimitsSettingsValidator>();
		services.AddSingleton<IValidator<ResilienceSettings>, ResilienceSettingsValidator>();
		services.AddSingleton<IValidator<OutputCacheSettings>, OutputCacheSettingsValidator>();
		services.AddSingleton<IValidator<SiteSettings>, SiteSettingsValidator>();

		// Configuration options with FluentValidation + ValidateOnStart
		services
			.AddOptions<ResilienceSettings>()
			.Bind(configuration.GetSection(ResilienceSettings.SectionName))
			.ValidateWithFluentValidation()
			.ValidateOnStart();

		services
			.AddOptions<OutputCacheSettings>()
			.Bind(configuration.GetSection(OutputCacheSettings.SectionName))
			.ValidateWithFluentValidation()
			.ValidateOnStart();

		services
			.AddOptions<RateLimitingSettings>()
			.BindConfiguration(RateLimitingSettings.SectionName)
			.ValidateWithFluentValidation()
			.ValidateOnStart();

		services
			.AddOptions<RequestLimitsSettings>()
			.BindConfiguration(RequestLimitsSettings.SectionName)
			.ValidateWithFluentValidation()
			.ValidateOnStart();

		// Note: FluentValidation, Repositories, and Business Services
		// are now registered via bounded context extensions:
		// - AddIdentityDomain()
		// - AddLoggingDomain()
		// - AddApiTrackingDomain()
		// - AddInfrastructure()

		services
			.AddOptions<SiteSettings>()
			.BindConfiguration(SiteSettings.SectionName)
			.ValidateWithFluentValidation()
			.ValidateOnStart();

		// Memory cache
		services.AddMemoryCache();

		return services;
	}
}