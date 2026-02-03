// <copyright file="ApplicationServicesRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Api.Configuration;
using SeventySix.Shared.Constants;
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
	/// - "Resilience" (via ResilienceOptions.SectionName)
	/// - "OutputCache" (via OutputCacheOptions.SectionName)
	/// - "RateLimiting" (via ConfigurationSectionConstants.RateLimiting)
	/// - "RequestLimits" (via ConfigurationSectionConstants.RequestLimits)
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
		services.AddSingleton<IValidator<ResilienceOptions>, ResilienceOptionsValidator>();

		// Configuration options with FluentValidation
		services.Configure<ResilienceOptions>(
			configuration.GetSection(ResilienceOptions.SectionName));

		services.Configure<OutputCacheOptions>(
			configuration.GetSection(OutputCacheOptions.SectionName));

		services
			.AddOptions<ResilienceOptions>()
			.Bind(configuration.GetSection(ResilienceOptions.SectionName))
			.ValidateWithFluentValidation()
			.ValidateOnStart();

		services
			.AddOptions<OutputCacheOptions>()
			.Bind(configuration.GetSection(OutputCacheOptions.SectionName))
			.ValidateOnStart();

		services
			.AddOptions<RateLimitingSettings>()
			.BindConfiguration(ConfigurationSectionConstants.RateLimiting)
			.ValidateWithFluentValidation()
			.ValidateOnStart();

		services
			.AddOptions<RequestLimitsSettings>()
			.BindConfiguration(ConfigurationSectionConstants.RequestLimits)
			.ValidateWithFluentValidation()
			.ValidateOnStart();

		// Note: FluentValidation, Repositories, and Business Services
		// are now registered via bounded context extensions:
		// - AddIdentityDomain()
		// - AddLoggingDomain()
		// - AddApiTrackingDomain()
		// - AddInfrastructure()

		// Memory cache
		services.AddMemoryCache();

		return services;
	}
}