// <copyright file="ServiceCollectionExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.IO.Compression;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.ResponseCompression;
using SeventySix.Api.Configuration;
using SeventySix.Identity;
using SeventySix.Shared;

namespace SeventySix.Api.Extensions;

/// <summary>
/// Extension methods for IServiceCollection to simplify dependency injection configuration.
/// </summary>
/// <remarks>
/// Provides clean, maintainable methods to register groups of related services.
/// This eliminates the need to maintain large registration blocks in Program.cs.
/// </remarks>
public static class ServiceCollectionExtensions
{
	/// <summary>
	/// Adds application-specific services to the service collection.
	/// Includes repositories, business logic services, validators, and HTTP clients.
	/// </summary>
	/// <param name="services">The service collection.</param>
	/// <param name="configuration">The application configuration.</param>
	/// <returns>The service collection for chaining.</returns>
	public static IServiceCollection AddApplicationServices(
		this IServiceCollection services,
		IConfiguration configuration)
	{
		// Configuration options with validation
		services.Configure<PollyOptions>(
			configuration.GetSection(PollyOptions.SECTION_NAME));

		services.Configure<OutputCacheOptions>(
			configuration.GetSection(OutputCacheOptions.SECTION_NAME));

		services.AddOptions<PollyOptions>()
			.Bind(configuration.GetSection(PollyOptions.SECTION_NAME))
			.ValidateOnStart();

		services.AddOptions<OutputCacheOptions>()
			.Bind(configuration.GetSection(OutputCacheOptions.SECTION_NAME))
			.ValidateOnStart();

		// Note: FluentValidation, Repositories, and Business Services
		// are now registered via bounded context extensions:
		// - AddIdentityDomain()
		// - AddLoggingDomain()
		// - AddApiTrackingDomain()
		// - AddInfrastructureDomain()

		// Memory cache
		services.AddMemoryCache();

		return services;
	}

	// AddDatabaseContext removed - bounded contexts now handle their own DbContext registration

	/// <summary>
	/// Adds response compression with optimized settings.
	/// </summary>
	/// <param name="services">The service collection.</param>
	/// <returns>The service collection for chaining.</returns>
	public static IServiceCollection AddOptimizedResponseCompression(
		this IServiceCollection services)
	{
		services.AddResponseCompression(options =>
		{
			options.EnableForHttps = true;
			options.Providers.Add<BrotliCompressionProvider>();
			options.Providers.Add<GzipCompressionProvider>();
		});

		services.Configure<BrotliCompressionProviderOptions>(options =>
		{
			options.Level = CompressionLevel.Fastest;
		});

		services.Configure<GzipCompressionProviderOptions>(options =>
		{
			options.Level = CompressionLevel.Fastest;
		});

		return services;
	}

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
			OutputCacheOptions? cacheConfig = configuration
				.GetSection(OutputCacheOptions.SECTION_NAME)
				.Get<OutputCacheOptions>();

			if (cacheConfig?.Policies == null)
			{
				return;
			}

			foreach ((string? name, CachePolicyConfig? config) in cacheConfig.Policies)
			{
				if (!config.Enabled)
				{
					continue;
				}

				string policyName = name.ToLowerInvariant();

				options.AddPolicy(policyName, policyBuilder =>
				{
					policyBuilder
						.Expire(TimeSpan.FromSeconds(config.DurationSeconds))
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

	/// <summary>
	/// Adds CORS policies from configuration.
	/// </summary>
	/// <param name="services">The service collection.</param>
	/// <param name="configuration">The application configuration.</param>
	/// <returns>The service collection for chaining.</returns>
	public static IServiceCollection AddConfiguredCors(
		this IServiceCollection services,
		IConfiguration configuration)
	{
		string[] allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
			?? ["http://localhost:4200"];

		services.AddCors(options =>
		{
			options.AddPolicy(
				name: "AllowedOrigins",
				policy =>
				{
					_ = policy
						.WithOrigins(allowedOrigins)
						.AllowAnyHeader()
						.AllowAnyMethod()
						.AllowCredentials();
				});
		});

		return services;
	}

	/// <summary>
	/// Adds rate limiting using ASP.NET Core's built-in rate limiter.
	/// Configures a fixed window rate limiter partitioned by client IP.
	/// Includes global limits and auth-specific stricter policies.
	/// </summary>
	/// <param name="services">The service collection.</param>
	/// <param name="configuration">The application configuration.</param>
	/// <returns>The service collection for chaining.</returns>
	/// <remarks>
	/// Rate limiting policies:
	/// - Global: Default limit for all endpoints (250/hour per IP)
	/// - auth-login: Stricter limit for login attempts (5/minute per IP)
	/// - auth-register: Stricter limit for registration (3/hour per IP)
	/// - auth-refresh: Moderate limit for token refresh (10/minute per IP)
	/// </remarks>
	public static IServiceCollection AddConfiguredRateLimiting(
		this IServiceCollection services,
		IConfiguration configuration)
	{
		RateLimitingSettings globalSettings =
			configuration
				.GetSection("RateLimiting")
				.Get<RateLimitingSettings>() ?? new RateLimitingSettings();

		AuthRateLimitSettings authSettings =
			configuration
				.GetSection("Auth:RateLimit")
				.Get<AuthRateLimitSettings>() ?? new AuthRateLimitSettings();

		if (!globalSettings.Enabled)
		{
			return AddDisabledRateLimiting(services);
		}

		return AddEnabledRateLimiting(services, globalSettings, authSettings);
	}

	private static IServiceCollection AddDisabledRateLimiting(IServiceCollection services)
	{
		services.AddRateLimiter(options =>
		{
			options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(
				_ => RateLimitPartition.GetNoLimiter<string>(string.Empty));

			options.AddPolicy(RateLimitPolicyConstants.AuthLogin, _ => RateLimitPartition.GetNoLimiter<string>(string.Empty));
			options.AddPolicy(RateLimitPolicyConstants.AuthRegister, _ => RateLimitPartition.GetNoLimiter<string>(string.Empty));
			options.AddPolicy(RateLimitPolicyConstants.AuthRefresh, _ => RateLimitPartition.GetNoLimiter<string>(string.Empty));
		});

		return services;
	}

	private static IServiceCollection AddEnabledRateLimiting(
		IServiceCollection services,
		RateLimitingSettings globalSettings,
		AuthRateLimitSettings authSettings)
	{
		services.AddRateLimiter(options =>
		{
			options.GlobalLimiter = CreateGlobalLimiter(globalSettings);
			AddAuthPolicies(options, authSettings);
			options.OnRejected = CreateRejectedHandler(globalSettings);
		});

		return services;
	}

	private static PartitionedRateLimiter<HttpContext> CreateGlobalLimiter(RateLimitingSettings settings) =>
		PartitionedRateLimiter.Create<HttpContext, string>(context =>
			RateLimitPartition.GetFixedWindowLimiter(
				partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
				factory: _ => new FixedWindowRateLimiterOptions
				{
					PermitLimit = settings.PermitLimit,
					Window = TimeSpan.FromSeconds(settings.WindowSeconds),
					QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
					QueueLimit = 0
				}));

	private static void AddAuthPolicies(RateLimiterOptions options, AuthRateLimitSettings settings)
	{
		options.AddPolicy(RateLimitPolicyConstants.AuthLogin, ctx => CreateAuthLimiter(ctx, settings.LoginAttemptsPerMinute, TimeSpan.FromMinutes(1)));
		options.AddPolicy(RateLimitPolicyConstants.AuthRegister, ctx => CreateAuthLimiter(ctx, settings.RegisterAttemptsPerHour, TimeSpan.FromHours(1)));
		options.AddPolicy(RateLimitPolicyConstants.AuthRefresh, ctx => CreateAuthLimiter(ctx, settings.TokenRefreshPerMinute, TimeSpan.FromMinutes(1)));
	}

	private static RateLimitPartition<string> CreateAuthLimiter(HttpContext context, int permitLimit, TimeSpan window) =>
		RateLimitPartition.GetFixedWindowLimiter(
			partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
			factory: _ => new FixedWindowRateLimiterOptions
			{
				PermitLimit = permitLimit,
				Window = window,
				QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
				QueueLimit = 0
			});

	private static Func<OnRejectedContext, CancellationToken, ValueTask> CreateRejectedHandler(RateLimitingSettings settings) =>
		async (context, cancellationToken) =>
		{
			context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
			context.HttpContext.Response.Headers.RetryAfter = settings.RetryAfterSeconds.ToString();

			await context.HttpContext.Response.WriteAsJsonAsync(new
			{
				error = "Too Many Requests",
				message = "Rate limit exceeded. Please try again later.",
				retryAfter = settings.RetryAfterSeconds
			}, cancellationToken);
		};
}