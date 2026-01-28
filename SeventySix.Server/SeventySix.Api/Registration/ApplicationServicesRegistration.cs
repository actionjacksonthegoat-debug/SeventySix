// <copyright file="ApplicationServicesRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Api.Configuration;
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
		// Configuration options with validation
		services.Configure<ResilienceOptions>(
			configuration.GetSection(ResilienceOptions.SectionName));

		services.Configure<OutputCacheOptions>(
			configuration.GetSection(OutputCacheOptions.SectionName));

		services
			.AddOptions<ResilienceOptions>()
			.Bind(configuration.GetSection(ResilienceOptions.SectionName))
			.ValidateOnStart();

		services
			.AddOptions<OutputCacheOptions>()
			.Bind(configuration.GetSection(OutputCacheOptions.SectionName))
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