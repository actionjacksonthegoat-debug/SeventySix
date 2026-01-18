// <copyright file="FusionCacheRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

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
				.GetSection(CacheSettings.SECTION_NAME)
				.Get<CacheSettings>()
			?? new CacheSettings();

		services.Configure<CacheSettings>(
			configuration.GetSection(CacheSettings.SECTION_NAME));

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
						ConnectRetry =
							cacheSettings.Valkey.ConnectRetry,
						KeepAlive =
							cacheSettings.Valkey.KeepAliveSeconds,
						ReconnectRetryPolicy =
							new ExponentialRetry(cacheSettings.Valkey.RetryBaseMs),
						AllowAdmin = false,
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
		FusionCacheCysharpMemoryPackSerializer serializer =
			new();

		RegisterDefaultCache(
			services,
			cacheSettings,
			serializer);

		RegisterIdentityCache(
			services,
			cacheSettings,
			serializer);

		RegisterLoggingCache(
			services,
			cacheSettings,
			serializer);

		RegisterApiTrackingCache(
			services,
			cacheSettings,
			serializer);

		return services;
	}

	/// <summary>
	/// Registers the default cache with HybridCache adapter.
	/// </summary>
	private static void RegisterDefaultCache(
		IServiceCollection services,
		CacheSettings cacheSettings,
		FusionCacheCysharpMemoryPackSerializer serializer)
	{
		services
			.AddFusionCache(CacheNames.Default)
			.WithOptions(
				options =>
				{
					options.CacheKeyPrefix =
						cacheSettings.DefaultKeyPrefix;
					// Enable distributed cache error logging
					options.EnableSyncEventHandlersExecution =
						true;
				})
			.WithDefaultEntryOptions(
				CreateEntryOptions(cacheSettings))
			.WithSerializer(serializer)
			.WithDistributedCache(
				serviceProvider =>
					new RedisCache(
						new RedisCacheOptions
						{
							ConnectionMultiplexerFactory =
								() => Task.FromResult(serviceProvider.GetRequiredService<IConnectionMultiplexer>()),
							InstanceName =
								cacheSettings.Valkey.InstanceName,
						}))
			.WithBackplane(
				serviceProvider =>
					new RedisBackplane(
						new RedisBackplaneOptions
						{
							ConnectionMultiplexerFactory =
								() => Task.FromResult(serviceProvider.GetRequiredService<IConnectionMultiplexer>()),
						}))
			.AsHybridCache();
	}

	/// <summary>
	/// Registers the Identity domain cache (short TTL for security-sensitive data).
	/// </summary>
	private static void RegisterIdentityCache(
		IServiceCollection services,
		CacheSettings cacheSettings,
		FusionCacheCysharpMemoryPackSerializer serializer)
	{
		services
			.AddFusionCache(CacheNames.Identity)
			.WithOptions(
				options =>
				{
					options.CacheKeyPrefix =
						cacheSettings.Identity.KeyPrefix;
					// Enable distributed cache error logging
					options.EnableSyncEventHandlersExecution =
						true;
				})
			.WithDefaultEntryOptions(
				CreateEntryOptions(cacheSettings.Identity))
			.WithSerializer(serializer)
			.WithDistributedCache(
				serviceProvider =>
					new RedisCache(
						new RedisCacheOptions
						{
							ConnectionMultiplexerFactory =
								() => Task.FromResult(serviceProvider.GetRequiredService<IConnectionMultiplexer>()),
							InstanceName =
								cacheSettings.Valkey.InstanceName,
						}))
			.WithBackplane(
				serviceProvider =>
					new RedisBackplane(
						new RedisBackplaneOptions
						{
							ConnectionMultiplexerFactory =
								() => Task.FromResult(serviceProvider.GetRequiredService<IConnectionMultiplexer>()),
						}));
	}

	/// <summary>
	/// Registers the Logging domain cache (longer TTL, read-heavy).
	/// </summary>
	private static void RegisterLoggingCache(
		IServiceCollection services,
		CacheSettings cacheSettings,
		FusionCacheCysharpMemoryPackSerializer serializer)
	{
		services
			.AddFusionCache(CacheNames.Logging)
			.WithOptions(
				options =>
				{
					options.CacheKeyPrefix =
						cacheSettings.Logging.KeyPrefix;
				})
			.WithDefaultEntryOptions(
				CreateEntryOptions(cacheSettings.Logging))
			.WithSerializer(serializer)
			.WithDistributedCache(
				serviceProvider =>
					new RedisCache(
						new RedisCacheOptions
						{
							ConnectionMultiplexerFactory =
								() => Task.FromResult(serviceProvider.GetRequiredService<IConnectionMultiplexer>()),
							InstanceName =
								cacheSettings.Valkey.InstanceName,
						}))
			.WithBackplane(
				serviceProvider =>
					new RedisBackplane(
						new RedisBackplaneOptions
						{
							ConnectionMultiplexerFactory =
								() => Task.FromResult(serviceProvider.GetRequiredService<IConnectionMultiplexer>()),
						}));
	}

	/// <summary>
	/// Registers the API Tracking domain cache.
	/// </summary>
	private static void RegisterApiTrackingCache(
		IServiceCollection services,
		CacheSettings cacheSettings,
		FusionCacheCysharpMemoryPackSerializer serializer)
	{
		services
			.AddFusionCache(CacheNames.ApiTracking)
			.WithOptions(
				options =>
				{
					options.CacheKeyPrefix =
						cacheSettings.ApiTracking.KeyPrefix;
				})
			.WithDefaultEntryOptions(
				CreateEntryOptions(cacheSettings.ApiTracking))
			.WithSerializer(serializer)
			.WithDistributedCache(
				serviceProvider =>
					new RedisCache(
						new RedisCacheOptions
						{
							ConnectionMultiplexerFactory =
								() => Task.FromResult(serviceProvider.GetRequiredService<IConnectionMultiplexer>()),
							InstanceName =
								cacheSettings.Valkey.InstanceName,
						}))
			.WithBackplane(
				serviceProvider =>
					new RedisBackplane(
						new RedisBackplaneOptions
						{
							ConnectionMultiplexerFactory =
								() => Task.FromResult(serviceProvider.GetRequiredService<IConnectionMultiplexer>()),
						}));
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
	/// Creates entry options from root cache settings.
	/// </summary>
	private static Action<FusionCacheEntryOptions> CreateEntryOptions(
		CacheSettings settings)
	{
		return options =>
		{
			options.Duration =
				settings.DefaultDuration;
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
				TimeSpan.FromMilliseconds(settings.DefaultDuration.TotalMilliseconds * 0.1);
		};
	}

	/// <summary>
	/// Creates entry options from named cache settings.
	/// </summary>
	private static Action<FusionCacheEntryOptions> CreateEntryOptions(
		NamedCacheSettings settings)
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