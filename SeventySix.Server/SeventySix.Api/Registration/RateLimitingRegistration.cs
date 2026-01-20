// <copyright file="RateLimitingRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using SeventySix.Api.Configuration;
using SeventySix.Api.Middleware;
using SeventySix.Identity;
using SeventySix.Shared.Constants;

namespace SeventySix.Api.Registration;

/// <summary>
/// Registration for rate limiting services.
/// </summary>
/// <remarks>
/// Rate limiting policies:
/// - Global: Default limit for all endpoints (500/hour per IP)
/// - auth-login: Stricter limit for login attempts (15/minute per IP)
/// - auth-register: Stricter limit for registration (3/hour per IP)
/// - auth-refresh: Moderate limit for token refresh (60/minute per IP)
///
/// Bypass policies (no rate limit):
/// - OPTIONS requests (CORS preflight)
/// - /health endpoints (container orchestrator health checks)
/// - /metrics endpoints (Prometheus scraping)
/// </remarks>
public static class RateLimitingRegistration
{
	/// <summary>
	/// Adds rate limiting using ASP.NET Core's built-in rate limiter.
	/// Configures a fixed window rate limiter partitioned by client IP.
	/// Includes global limits and auth-specific stricter policies.
	/// </summary>
	/// <remarks>
	/// Reads configuration sections:
	/// - "RateLimiting" (global settings)
	/// - "Auth:RateLimit" (auth-specific settings)
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
	public static IServiceCollection AddConfiguredRateLimiting(
		this IServiceCollection services,
		IConfiguration configuration)
	{
		RateLimitingSettings globalSettings =
			configuration.GetSection(ConfigurationSectionConstants.RateLimiting).Get<RateLimitingSettings>()
			?? new RateLimitingSettings();

		AuthRateLimitSettings authSettings =
			configuration
				.GetSection(ConfigurationSectionConstants.AuthNested.RateLimit)
				.Get<AuthRateLimitSettings>()
			?? new AuthRateLimitSettings();

		if (!globalSettings.Enabled)
		{
			return AddDisabledRateLimiting(services);
		}

		return AddEnabledRateLimiting(
			services,
			globalSettings,
			authSettings,
			configuration);
	}

	private static IServiceCollection AddDisabledRateLimiting(
		IServiceCollection services)
	{
		services.AddRateLimiter(
			options =>
			{
				options.GlobalLimiter =
					PartitionedRateLimiter.Create<
						HttpContext,
						string>(
							_ =>
								RateLimitPartition.GetNoLimiter<string>(string.Empty));

				options.AddPolicy(
					RateLimitPolicyConstants.AuthLogin,
					_ => RateLimitPartition.GetNoLimiter<string>(string.Empty));
				options.AddPolicy(
					RateLimitPolicyConstants.AuthRegister,
					_ => RateLimitPartition.GetNoLimiter<string>(string.Empty));
				options.AddPolicy(
					RateLimitPolicyConstants.AuthRefresh,
					_ => RateLimitPartition.GetNoLimiter<string>(string.Empty));
			});

		return services;
	}

	private static IServiceCollection AddEnabledRateLimiting(
		IServiceCollection services,
		RateLimitingSettings globalSettings,
		AuthRateLimitSettings authSettings,
		IConfiguration configuration)
	{
		string[] allowedOrigins =
			configuration?.GetSection(ConfigurationSectionConstants.Cors.AllowedOrigins).Get<string[]>()
			?? ["http://localhost:4200"];

		ISet<string> allowedOriginsSet =
			new HashSet<string>(
				allowedOrigins,
				StringComparer.OrdinalIgnoreCase);

		services.AddRateLimiter(
			options =>
			{
				options.GlobalLimiter =
					CreateGlobalLimiter(globalSettings);
				AddAuthPolicies(options, authSettings);

				Func<
					OnRejectedContext,
					CancellationToken,
					ValueTask> originalOnRejected =
					CreateRejectedHandler(globalSettings);
				options.OnRejected =
					async (context, cancellationToken) =>
					{
						// Preserve CORS headers on rate limiter rejections
						CorsHeaderHelper.AddCorsHeadersIfAllowed(
							context.HttpContext,
							allowedOriginsSet);

						await originalOnRejected(context, cancellationToken);
					};
			});

		return services;
	}

	private static PartitionedRateLimiter<HttpContext> CreateGlobalLimiter(
		RateLimitingSettings settings) =>
		PartitionedRateLimiter.Create<HttpContext, string>(
			context =>
			{
				// Bypass rate limiting for CORS preflight (OPTIONS) requests
				if (HttpMethods.IsOptions(context.Request.Method))
				{
					return RateLimitPartition.GetNoLimiter<string>("__preflight__");
				}

				// Bypass rate limiting for health checks and metrics endpoints
				// Container orchestrators hit these frequently
				if (context.Request.Path.StartsWithSegments("/health")
					|| context.Request.Path.StartsWithSegments("/metrics"))
				{
					return RateLimitPartition.GetNoLimiter<string>("__internal__");
				}

				return RateLimitPartition.GetFixedWindowLimiter(
					partitionKey: context.Connection.RemoteIpAddress?.ToString()
						?? "anonymous",
					factory: _ =>
						new FixedWindowRateLimiterOptions
						{
							PermitLimit = settings.PermitLimit,
							Window =
								TimeSpan.FromSeconds(settings.WindowSeconds),
							QueueProcessingOrder =
								QueueProcessingOrder.OldestFirst,
							QueueLimit = 0,
						});
			});

	private static void AddAuthPolicies(
		RateLimiterOptions options,
		AuthRateLimitSettings settings)
	{
		options.AddPolicy(
			RateLimitPolicyConstants.AuthLogin,
			ctx =>
				CreateAuthLimiter(
					ctx,
					settings.LoginAttemptsPerMinute,
					TimeSpan.FromMinutes(1)));
		options.AddPolicy(
			RateLimitPolicyConstants.AuthRegister,
			ctx =>
				CreateAuthLimiter(
					ctx,
					settings.RegisterAttemptsPerHour,
					TimeSpan.FromHours(1)));
		options.AddPolicy(
			RateLimitPolicyConstants.AuthRefresh,
			ctx =>
				CreateAuthLimiter(
					ctx,
					settings.TokenRefreshPerMinute,
					TimeSpan.FromMinutes(1)));
	}

	private static RateLimitPartition<string> CreateAuthLimiter(
		HttpContext context,
		int permitLimit,
		TimeSpan window) =>
		RateLimitPartition.GetFixedWindowLimiter(
			partitionKey: context.Connection.RemoteIpAddress?.ToString()
				?? "anonymous",
			factory: _ => new FixedWindowRateLimiterOptions
			{
				PermitLimit = permitLimit,
				Window = window,
				QueueProcessingOrder =
					QueueProcessingOrder.OldestFirst,
				QueueLimit = 0,
			});

	private static Func<
		OnRejectedContext,
		CancellationToken,
		ValueTask
	> CreateRejectedHandler(RateLimitingSettings settings) =>
		async (context, cancellationToken) =>
		{
			context.HttpContext.Response.StatusCode =
				StatusCodes.Status429TooManyRequests;
			context.HttpContext.Response.Headers.RetryAfter =
				settings.RetryAfterSeconds.ToString();

			await context.HttpContext.Response.WriteAsJsonAsync(
				new
				{
					error = "Too Many Requests",
					message = "Rate limit exceeded. Please try again later.",
					retryAfter = settings.RetryAfterSeconds,
				},
				cancellationToken);
		};
}