// <copyright file="OutputCacheRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics.CodeAnalysis;
using Microsoft.AspNetCore.OutputCaching.StackExchangeRedis;
using SeventySix.Api.Configuration;
using SeventySix.Shared.Settings;
using StackExchange.Redis;

namespace SeventySix.Api.Registration;

/// <summary>
/// Registration for output caching services.
/// </summary>
[ExcludeFromCodeCoverage]
public static class OutputCacheRegistration
{
	/// <summary>
	/// Adds output caching with Valkey distributed store and dynamic policy registration.
	/// Automatically discovers and registers all policies defined in appsettings.json.
	/// </summary>
	/// <remarks>
	/// Reads configuration section: OutputCacheSettings.SectionName (policies and defaults).
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
					.GetSection(CacheSettings.SectionName)
					.Get<CacheSettings>();

			if (cacheSettings is null)
			{
				throw new InvalidOperationException(
					$"Cache settings must be configured in appsettings.json section '{CacheSettings.SectionName}'");
			}

			string outputCacheInstanceName =
				$"{cacheSettings.Valkey.InstanceName}OutputCache:";

			// Use shared IConnectionMultiplexer (registered in FusionCacheRegistration)
			// Configure using OptionsBuilder to get proper DI-resolved IServiceProvider
			services.AddStackExchangeRedisOutputCache(_ => { });

			services.AddOptions<RedisOutputCacheOptions>()
				.Configure<IServiceProvider>(
					(cacheOptions, serviceProvider) =>
					{
						cacheOptions.InstanceName =
							outputCacheInstanceName;
						cacheOptions.ConnectionMultiplexerFactory =
							() => Task.FromResult(
								serviceProvider.GetRequiredService<IConnectionMultiplexer>());
					});
		}

		services.AddOutputCache(
			options =>
			{
				OutputCacheSettings? cacheConfig =
					configuration
						.GetSection(OutputCacheSettings.SectionName)
						.Get<OutputCacheSettings>();

				if (cacheConfig?.Policies == null)
				{
					return;
				}

				foreach (
					(
						string? name,
						CachePolicyConfig? config
					) in cacheConfig.Policies)
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