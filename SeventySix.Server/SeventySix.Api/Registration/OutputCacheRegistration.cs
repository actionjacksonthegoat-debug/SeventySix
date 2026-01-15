// <copyright file="OutputCacheRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Api.Configuration;
using SeventySix.Shared.Settings;

namespace SeventySix.Api.Registration;

/// <summary>
/// Registration for output caching services.
/// </summary>
public static class OutputCacheRegistration
{
	/// <summary>
	/// Adds output caching with Valkey distributed store and dynamic policy registration.
	/// Automatically discovers and registers all policies defined in appsettings.json.
	/// </summary>
	/// <remarks>
	/// Reads configuration section: OutputCacheOptions.SECTION_NAME (policies and defaults).
	/// Uses Valkey (Redis-compatible) for distributed output caching across nodes.
	/// In Test environment, uses in-memory cache (no Valkey dependency).
	/// </remarks>
	/// <param name="services">
	/// The service collection.
	/// </param>
	/// <param name="configuration">
	/// The application configuration.
	/// </param>
	/// <param name="environmentName">
	/// The hosting environment name (Development, Production, Test).
	/// </param>
	/// <returns>
	/// The service collection for chaining.
	/// </returns>
	public static IServiceCollection AddConfiguredOutputCache(
		this IServiceCollection services,
		IConfiguration configuration,
		string environmentName = "Development")
	{
		// Skip Valkey in Test environment - use in-memory cache for isolation
		bool useValkey =
			!string.Equals(
				environmentName,
				"Test",
				StringComparison.OrdinalIgnoreCase);

		if (useValkey)
		{
			CacheSettings? cacheSettings =
				configuration
					.GetSection(CacheSettings.SECTION_NAME)
					.Get<CacheSettings>();

			// Use shared IConnectionMultiplexer (registered in FusionCacheRegistration)
			services.AddStackExchangeRedisOutputCache(
				options =>
				{
					options.ConnectionMultiplexerFactory =
						async () =>
						{
							IServiceProvider serviceProvider =
								services.BuildServiceProvider();
							return await Task.FromResult(
								serviceProvider.GetRequiredService<StackExchange.Redis.IConnectionMultiplexer>());
						};
					options.InstanceName =
						$"{cacheSettings?.Valkey.InstanceName ?? "SeventySix:"}OutputCache:";
				});
		}

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