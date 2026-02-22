// <copyright file="FusionCacheRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.Extensions.Caching.StackExchangeRedis;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Settings;
using StackExchange.Redis;
using ZiggyCreatures.Caching.Fusion;
using ZiggyCreatures.Caching.Fusion.Backplane.StackExchangeRedis;
using ZiggyCreatures.Caching.Fusion.Serialization.CysharpMemoryPack;

namespace SeventySix.Shared.Registration;

/// <summary>
/// Registers FusionCache with Valkey backend and MemoryPack serialization.
/// </summary>
/// <remarks>
/// Provides two registration modes:
/// - Production/Development: Full FusionCache with Valkey L2 cache, backplane, and MemoryPack serialization
/// - Test: Memory-only FusionCache without external dependencies (no Valkey connection timeouts)
/// </remarks>
public static class FusionCacheRegistration
{
	/// <summary>
	/// Adds FusionCache with MemoryPack serializer and Valkey backend.
	/// In Test environment, uses memory-only cache to avoid Valkey connection timeouts.
	/// </summary>
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
	public static IServiceCollection AddFusionCacheWithValkey(
		this IServiceCollection services,
		IConfiguration configuration,
		string environmentName = "Development")
	{
		CacheSettings cacheSettings =
			configuration
				.GetSection(CacheSettings.SectionName)
				.Get<CacheSettings>()
			?? new CacheSettings();

		services.Configure<CacheSettings>(
			configuration.GetSection(CacheSettings.SectionName));

		// Register CacheSettings validator and enable ValidateOnStart
		services.AddSingleton<IValidator<CacheSettings>, CacheSettingsValidator>();

		services
			.AddOptions<CacheSettings>()
			.Bind(configuration.GetSection(CacheSettings.SectionName))
			.ValidateWithFluentValidation()
			.ValidateOnStart();

		// Skip Valkey in Test environment - use memory-only cache for fast tests
		if (string.Equals(
			environmentName,
			"Test",
			StringComparison.OrdinalIgnoreCase))
		{
			return services.AddFusionCacheMemoryOnly(cacheSettings);
		}

		// Register shared Redis connection with production resilience
		// Best practice: single multiplexer for all caches
		services.AddSingleton<IConnectionMultiplexer>(
			serviceProvider =>
			{
				ILogger<IConnectionMultiplexer> logger =
					serviceProvider.GetRequiredService<
						ILogger<IConnectionMultiplexer>>();

				ConfigurationOptions options =
					new()
					{
						AbortOnConnectFail = false,
						ConnectTimeout =
							cacheSettings.Valkey.ConnectTimeoutMs,
						SyncTimeout =
							cacheSettings.Valkey.SyncTimeoutMs,
						AsyncTimeout =
							cacheSettings.Valkey.AsyncTimeoutMs,
						ConnectRetry =
							cacheSettings.Valkey.ConnectRetry,
						KeepAlive =
							cacheSettings.Valkey.KeepAliveSeconds,
						ReconnectRetryPolicy =
							new ExponentialRetry(cacheSettings.Valkey.RetryBaseMs),
						AllowAdmin = false,
						Ssl =
							cacheSettings.Valkey.UseSsl,
					};

				// Parse connection string (host:port or host:port,password=xxx)
				options.EndPoints.Add(cacheSettings.Valkey.ConnectionString);

				IConnectionMultiplexer multiplexer =
					ConnectionMultiplexer.Connect(options);

				// Log connection events for observability
				multiplexer.ConnectionFailed +=
					(sender, connectionFailedArgs) =>
					{
						logger.LogWarning(
							"Redis connection failed: {FailureType} - {Exception}",
							connectionFailedArgs.FailureType,
							connectionFailedArgs.Exception?.Message);
					};

				multiplexer.ConnectionRestored +=
					(sender, connectionRestoredArgs) =>
					{
						logger.LogWarning(
							"Redis connection restored: {Endpoint}",
							connectionRestoredArgs.EndPoint);
					};

				return multiplexer;
			});

		return RegisterDistributedCaches(services, cacheSettings);
	}

	/// <summary>
	/// Registers all named caches with Valkey distributed backend.
	/// </summary>
	/// <remarks>
	/// Uses shared IConnectionMultiplexer for all caches and backplane.
	/// This ensures single connection pool (best practice per StackExchange.Redis docs).
	/// </remarks>
	private static IServiceCollection RegisterDistributedCaches(
		IServiceCollection services,
		CacheSettings cacheSettings)
	{
		RegisterNamedCache(
			services,
			CacheNames.Default,
			cacheSettings.DefaultKeyPrefix,
			cacheSettings,
			cacheSettings.Valkey.InstanceName,
			enableSyncEvents: true)
			.AsHybridCache();

		RegisterNamedCache(
			services,
			CacheNames.Identity,
			cacheSettings.Identity.KeyPrefix,
			cacheSettings.Identity,
			cacheSettings.Valkey.InstanceName,
			enableSyncEvents: true);

		RegisterNamedCache(
			services,
			CacheNames.Logging,
			cacheSettings.Logging.KeyPrefix,
			cacheSettings.Logging,
			cacheSettings.Valkey.InstanceName);

		RegisterNamedCache(
			services,
			CacheNames.ApiTracking,
			cacheSettings.ApiTracking.KeyPrefix,
			cacheSettings.ApiTracking,
			cacheSettings.Valkey.InstanceName);

		return services;
	}

	/// <summary>
	/// Registers a named cache with Valkey distributed backend.
	/// </summary>
	private static IFusionCacheBuilder RegisterNamedCache(
		IServiceCollection services,
		string cacheName,
		string keyPrefix,
		ICacheDurationSettings settings,
		string valkeyInstanceName,
		bool enableSyncEvents = false)
	{
		return services
			.AddFusionCache(cacheName)
			.WithOptions(
				options =>
				{
					options.CacheKeyPrefix =
						keyPrefix;
					options.EnableSyncEventHandlersExecution =
						enableSyncEvents;
				})
			.WithDefaultEntryOptions(
				CreateEntryOptions(settings))
			.WithSerializer(new FusionCacheCysharpMemoryPackSerializer())
			.AddValkeyComponents(valkeyInstanceName);
	}

	/// <summary>
	/// Adds memory-only FusionCache for testing without Valkey.
	/// </summary>
	/// <param name="services">
	/// The service collection.
	/// </param>
	/// <param name="cacheSettings">
	/// Cache settings from configuration with test-specific durations.
	/// </param>
	/// <returns>
	/// The service collection for chaining.
	/// </returns>
	public static IServiceCollection AddFusionCacheMemoryOnly(
		this IServiceCollection services,
		CacheSettings cacheSettings)
	{
		services
			.AddFusionCache(CacheNames.Default)
			.WithOptions(
				options =>
				{
					options.CacheKeyPrefix =
						cacheSettings.DefaultKeyPrefix;
				})
			.WithDefaultEntryOptions(
				CreateEntryOptions(cacheSettings))
			.AsHybridCache();

		services
			.AddFusionCache(CacheNames.Identity)
			.WithOptions(
				options =>
				{
					options.CacheKeyPrefix =
						cacheSettings.Identity.KeyPrefix;
				})
			.WithDefaultEntryOptions(
				CreateEntryOptions(cacheSettings.Identity));

		services
			.AddFusionCache(CacheNames.Logging)
			.WithOptions(
				options =>
				{
					options.CacheKeyPrefix =
						cacheSettings.Logging.KeyPrefix;
				})
			.WithDefaultEntryOptions(
				CreateEntryOptions(cacheSettings.Logging));

		services
			.AddFusionCache(CacheNames.ApiTracking)
			.WithOptions(
				options =>
				{
					options.CacheKeyPrefix =
						cacheSettings.ApiTracking.KeyPrefix;
				})
			.WithDefaultEntryOptions(
				CreateEntryOptions(cacheSettings.ApiTracking));

		return services;
	}

	/// <summary>
	/// Adds shared Valkey (Redis) distributed cache and backplane to a FusionCache builder.
	/// Reuses the shared <see cref="IConnectionMultiplexer"/> registered in the DI container.
	/// </summary>
	/// <param name="builder">
	/// The FusionCache builder to configure.
	/// </param>
	/// <param name="instanceName">
	/// The Redis instance name prefix.
	/// </param>
	/// <returns>
	/// The builder for chaining.
	/// </returns>
	private static IFusionCacheBuilder AddValkeyComponents(
		this IFusionCacheBuilder builder,
		string instanceName)
	{
		return builder
			.WithDistributedCache(
				serviceProvider =>
					new RedisCache(
						new RedisCacheOptions
						{
							ConnectionMultiplexerFactory =
								() => Task.FromResult(
									serviceProvider.GetRequiredService<IConnectionMultiplexer>()),
							InstanceName =
								instanceName,
						}))
			.WithBackplane(
				serviceProvider =>
					new RedisBackplane(
						new RedisBackplaneOptions
						{
							ConnectionMultiplexerFactory =
								() => Task.FromResult(
									serviceProvider.GetRequiredService<IConnectionMultiplexer>()),
						}));
	}

	/// <summary>
	/// Creates entry options from cache duration settings.
	/// Accepts both <see cref="CacheSettings"/> and <see cref="NamedCacheSettings"/>
	/// via the shared <see cref="ICacheDurationSettings"/> abstraction.
	/// </summary>
	private static Action<FusionCacheEntryOptions> CreateEntryOptions(
		ICacheDurationSettings settings)
	{
		return options =>
		{
			options.Duration =
				settings.Duration;
			options.FailSafeMaxDuration =
				settings.FailSafeMaxDuration;
			options.FailSafeThrottleDuration =
				settings.FailSafeThrottleDuration;
			// Enable fail-safe to serve stale data during backend failures
			options.IsFailSafeEnabled =
				true;
			// Explicitly enable distributed cache read/write operations
			options.SkipDistributedCacheRead =
				false;
			options.SkipDistributedCacheWrite =
				false;
			options.SkipDistributedCacheReadWhenStale =
				false;
			// Allow background refresh for better performance
			options.AllowBackgroundDistributedCacheOperations =
				true;
			// Eager refresh: proactively refresh when 80% of duration elapsed
			// Prevents cache misses during high traffic
			options.EagerRefreshThreshold =
				0.8f;
			// Add jitter (±10%) to prevent thundering herd on cache expiration
			options.JitterMaxDuration =
				TimeSpan.FromMilliseconds(settings.Duration.TotalMilliseconds * 0.1);
		};
	}
}