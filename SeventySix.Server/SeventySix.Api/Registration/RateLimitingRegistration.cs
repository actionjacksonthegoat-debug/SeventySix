// <copyright file="RateLimitingRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using SeventySix.Api.Configuration;
using SeventySix.Identity;
using SeventySix.Shared.Settings;

namespace SeventySix.Api.Registration;

/// <summary>
/// Registration for rate limiting services.
/// </summary>
/// <remarks>
/// Rate limiting policies:
/// - Global: Default limit for all endpoints (250/hour per IP)
/// - auth-login: Stricter limit for login attempts (5/minute per IP)
/// - auth-register: Stricter limit for registration (3/hour per IP)
/// - auth-refresh: Moderate limit for token refresh (10/minute per IP)
/// </remarks>
public static class RateLimitingRegistration
{
	/// <summary>
	/// Adds rate limiting using ASP.NET Core's built-in rate limiter.
	/// Configures a fixed window rate limiter partitioned by client IP.
	/// Includes global limits and auth-specific stricter policies.
	/// </summary>
	/// <param name="services">The service collection.</param>
	/// <param name="configuration">The application configuration.</param>
	/// <returns>The service collection for chaining.</returns>
	public static IServiceCollection AddConfiguredRateLimiting(
		this IServiceCollection services,
		IConfiguration configuration)
	{
		RateLimitingSettings globalSettings =
			configuration.GetSection("RateLimiting").Get<RateLimitingSettings>()
			?? new RateLimitingSettings();

		AuthRateLimitSettings authSettings =
			configuration
				.GetSection("Auth:RateLimit")
				.Get<AuthRateLimitSettings>()
			?? new AuthRateLimitSettings();

		if (!globalSettings.Enabled)
		{
			return AddDisabledRateLimiting(services);
		}

		return AddEnabledRateLimiting(services, globalSettings, authSettings);
	}

	private static IServiceCollection AddDisabledRateLimiting(
		IServiceCollection services)
	{
		services.AddRateLimiter(options =>
		{
			options.GlobalLimiter =
				PartitionedRateLimiter.Create<
					HttpContext,
					string
			>(_ => RateLimitPartition.GetNoLimiter<string>(string.Empty));

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
		AuthRateLimitSettings authSettings)
	{
		services.AddRateLimiter(options =>
		{
			options.GlobalLimiter =
				CreateGlobalLimiter(globalSettings);
			AddAuthPolicies(options, authSettings);
			options.OnRejected =
				CreateRejectedHandler(globalSettings);
		});

		return services;
	}

	private static PartitionedRateLimiter<HttpContext> CreateGlobalLimiter(
		RateLimitingSettings settings) =>
		PartitionedRateLimiter.Create<HttpContext, string>(context =>
			RateLimitPartition.GetFixedWindowLimiter(
				partitionKey: context.Connection.RemoteIpAddress?.ToString()
					?? "anonymous",
				factory: _ => new FixedWindowRateLimiterOptions
				{
					PermitLimit = settings.PermitLimit,
					Window =
						TimeSpan.FromSeconds(settings.WindowSeconds),
					QueueProcessingOrder =
						QueueProcessingOrder.OldestFirst,
					QueueLimit = 0,
				}));

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