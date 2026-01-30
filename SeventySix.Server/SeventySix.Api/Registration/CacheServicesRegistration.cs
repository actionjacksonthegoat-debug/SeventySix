// <copyright file="CacheServicesRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.DependencyInjection;
using SeventySix.Api.Infrastructure.Services;
using SeventySix.Shared.Interfaces;

namespace SeventySix.Api.Registration;

/// <summary>
/// Registers cache-related services for the Api layer.
/// </summary>
public static class CacheServicesRegistration
{
	/// <summary>
	/// Adds cache invalidation service to the service collection.
	/// </summary>
	/// <param name="services">
	/// The service collection.
	/// </param>
	/// <returns>
	/// The service collection for chaining.
	/// </returns>
	public static IServiceCollection AddCacheServices(
		this IServiceCollection services)
	{
		services.AddScoped<ICacheInvalidationService, CacheInvalidationService>();

		return services;
	}
}