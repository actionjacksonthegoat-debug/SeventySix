// <copyright file="OutputCacheRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Api.Configuration;

namespace SeventySix.Api.Registration;

/// <summary>
/// Registration for output caching services.
/// </summary>
public static class OutputCacheRegistration
{
	/// <summary>
	/// Adds output caching with dynamic policy registration from configuration.
	/// Automatically discovers and registers all policies defined in appsettings.json.
	/// </summary>
	/// <param name="services">The service collection.</param>
	/// <param name="configuration">The application configuration.</param>
	/// <returns>The service collection for chaining.</returns>
	public static IServiceCollection AddConfiguredOutputCache(
		this IServiceCollection services,
		IConfiguration configuration)
	{
		services.AddOutputCache(options =>
		{
			OutputCacheOptions? cacheConfig =
				configuration
					.GetSection(OutputCacheOptions.SECTION_NAME)
					.Get<OutputCacheOptions>();

			if (cacheConfig?.Policies == null)
			{
				return;
			}

			foreach (
				(
					string? name,
					CachePolicyConfig? config
				) in cacheConfig.Policies
			)
			{
				if (!config.Enabled)
				{
					continue;
				}

				string policyName = name.ToLowerInvariant();

				options.AddPolicy(
					policyName,
					policyBuilder =>
					{
						policyBuilder
							.Expire(
								TimeSpan.FromSeconds(config.DurationSeconds))
							.Tag(config.Tag);

						if (config.VaryByQuery.Length > 0)
						{
							policyBuilder.SetVaryByQuery(config.VaryByQuery);
						}
					});
			}
		});

		services.AddResponseCaching();

		return services;
	}
}
