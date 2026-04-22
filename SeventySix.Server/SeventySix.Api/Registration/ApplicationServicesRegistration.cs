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
		// Configuration options with FluentValidation + ValidateOnStart
		services.AddDomainSettings<ResilienceSettings, ResilienceSettingsValidator>(
			configuration,
			ResilienceSettings.SectionName);

		services.AddDomainSettings<OutputCacheSettings, OutputCacheSettingsValidator>(
			configuration,
			OutputCacheSettings.SectionName);

		services.AddDomainSettings<RateLimitingSettings, RateLimitingSettingsValidator>(
			configuration,
			RateLimitingSettings.SectionName);

		services.AddDomainSettings<RequestLimitsSettings, RequestLimitsSettingsValidator>(
			configuration,
			RequestLimitsSettings.SectionName);

		// Note: FluentValidation, Repositories, and Business Services
		// are now registered via bounded context extensions:
		// - AddIdentityDomain()
		// - AddLoggingDomain()
		// - AddApiTrackingDomain()
		// - AddInfrastructure()

		services.AddDomainSettings<SiteSettings, SiteSettingsValidator>(
			configuration,
			SiteSettings.SectionName);

		// Memory cache
		services.AddMemoryCache();

		return services;
	}
}