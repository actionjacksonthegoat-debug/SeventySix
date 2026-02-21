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
/// <para>
/// Rate limiting policies:
/// </para>
/// <list type="bullet">
///   <item><description>Global: Default limit for all endpoints (2500/hour per IP)</description></item>
///   <item><description>auth-login: Stricter limit for login attempts (5/minute per IP)</description></item>
///   <item><description>auth-register: Stricter limit for registration (3/hour per IP)</description></item>
///   <item><description>auth-refresh: Moderate limit for token refresh (10/minute per IP)</description></item>
///   <item><description>altcha-challenge: ALTCHA challenge generation (10/minute per IP)</description></item>
///   <item><description>client-logs: Client-side logging endpoints (30/minute per IP)</description></item>
///   <item><description>health-check: Rate limit for health endpoints (30/minute per IP)</description></item>
/// </list>
/// <para>
/// Bypass policies (no rate limit):
/// </para>
/// <list type="bullet">
///   <item><description>OPTIONS requests (CORS preflight)</description></item>
/// </list>
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
			configuration.GetSection(RateLimitingSettings.SectionName).Get<RateLimitingSettings>()
			?? throw new InvalidOperationException(
				$"{RateLimitingSettings.SectionName} configuration section is required");

		AuthRateLimitSettings authSettings =
			configuration
				.GetSection($"{AuthSettings.SectionName}:RateLimit")
				.Get<AuthRateLimitSettings>()
			?? throw new InvalidOperationException(
				$"{AuthSettings.SectionName}:RateLimit configuration section is required");

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

	/// <summary>
	/// Configures rate limiting with all policies disabled (no-op limiters).
	/// Used when rate limiting is disabled via configuration.
	/// </summary>
	/// <param name="services">
	/// The service collection.
	/// </param>
	/// <returns>
	/// The service collection for chaining.
	/// </returns>
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
								RateLimitPartition.GetNoLimiter(string.Empty));

				options.AddPolicy(
					RateLimitPolicyConstants.AuthLogin,
					_ => RateLimitPartition.GetNoLimiter(string.Empty));
				options.AddPolicy(
					RateLimitPolicyConstants.AuthRegister,
					_ => RateLimitPartition.GetNoLimiter(string.Empty));
				options.AddPolicy(
					RateLimitPolicyConstants.AuthRefresh,
					_ => RateLimitPartition.GetNoLimiter(string.Empty));
				options.AddPolicy(
					RateLimitPolicyConstants.AltchaChallenge,
					_ => RateLimitPartition.GetNoLimiter(string.Empty));
				options.AddPolicy(
					RateLimitPolicyConstants.ClientLogs,
					_ => RateLimitPartition.GetNoLimiter(string.Empty));
				options.AddPolicy(
					RateLimitPolicyConstants.MfaVerify,
					_ => RateLimitPartition.GetNoLimiter(string.Empty));
				options.AddPolicy(
					RateLimitPolicyConstants.MfaResend,
					_ => RateLimitPartition.GetNoLimiter(string.Empty));
			});

		return services;
	}

	/// <summary>
	/// Configures rate limiting with all policies enabled.
	/// Sets up global limiter, auth-specific policies, and rejection handling.
	/// </summary>
	/// <param name="services">
	/// The service collection.
	/// </param>
	/// <param name="globalSettings">
	/// The global rate limiting settings.
	/// </param>
	/// <param name="authSettings">
	/// The authentication-specific rate limiting settings.
	/// </param>
	/// <param name="configuration">
	/// The application configuration for CORS origins.
	/// </param>
	/// <returns>
	/// The service collection for chaining.
	/// </returns>
	private static IServiceCollection AddEnabledRateLimiting(
		IServiceCollection services,
		RateLimitingSettings globalSettings,
		AuthRateLimitSettings authSettings,
		IConfiguration configuration)
	{
		string[] allowedOrigins =
			configuration?.GetSection(ConfigurationSectionConstants.Cors.AllowedOrigins).Get<string[]>()
			?? [];

		ISet<string> allowedOriginsSet =
			allowedOrigins.ToHashSet(
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

	/// <summary>
	/// Creates the global rate limiter partitioned by client IP address.
	/// Includes special handling for health endpoints and CORS preflight requests.
	/// </summary>
	/// <param name="settings">
	/// The rate limiting settings containing global and health endpoint limits.
	/// </param>
	/// <returns>
	/// A partitioned rate limiter for HTTP contexts.
	/// </returns>
	private static PartitionedRateLimiter<HttpContext> CreateGlobalLimiter(
		RateLimitingSettings settings) =>
		PartitionedRateLimiter.Create<HttpContext, string>(
			context =>
			{
				// Bypass rate limiting for CORS preflight (OPTIONS) requests
				if (HttpMethods.IsOptions(context.Request.Method))
				{
					return RateLimitPartition.GetNoLimiter(
						RateLimitPartitionKeys.Preflight);
				}

				// Apply rate limiting for health check endpoints (DDOS protection)
				if (context.Request.Path.StartsWithSegments(EndpointPathConstants.Health.Base)
					|| context.Request.Path.StartsWithSegments(EndpointPathConstants.Health.Versioned))
				{
					return RateLimitPartition.GetFixedWindowLimiter(
						partitionKey: context.Connection.RemoteIpAddress?.ToString()
							?? RateLimitPartitionKeys.Anonymous,
						factory: _ =>
							new FixedWindowRateLimiterOptions
							{
								PermitLimit = settings.Health.PermitLimit,
								Window =
									TimeSpan.FromSeconds(settings.Health.WindowSeconds),
								QueueProcessingOrder =
									QueueProcessingOrder.OldestFirst,
								QueueLimit = 0,
							});
				}

				return RateLimitPartition.GetFixedWindowLimiter(
					partitionKey: context.Connection.RemoteIpAddress?.ToString()
						?? RateLimitPartitionKeys.Anonymous,
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

	/// <summary>
	/// Adds authentication-specific rate limiting policies.
	/// Configures stricter limits for login, registration, and token refresh endpoints.
	/// </summary>
	/// <param name="options">
	/// The rate limiter options to configure.
	/// </param>
	/// <param name="settings">
	/// The authentication rate limiting settings.
	/// </param>
	private static void AddAuthPolicies(
		RateLimiterOptions options,
		AuthRateLimitSettings settings)
	{
		options.AddPolicy(
			RateLimitPolicyConstants.AuthLogin,
			context =>
				CreateAuthLimiter(
					context,
					settings.LoginAttemptsPerMinute,
					TimeSpan.FromMinutes(1)));
		options.AddPolicy(
			RateLimitPolicyConstants.AuthRegister,
			context =>
				CreateAuthLimiter(
					context,
					settings.RegisterAttemptsPerHour,
					TimeSpan.FromHours(1)));
		options.AddPolicy(
			RateLimitPolicyConstants.AuthRefresh,
			context =>
				CreateAuthLimiter(
					context,
					settings.TokenRefreshPerMinute,
					TimeSpan.FromMinutes(1)));
		options.AddPolicy(
			RateLimitPolicyConstants.AltchaChallenge,
			context =>
				CreateAuthLimiter(
					context,
					settings.AltchaChallengePerMinute,
					TimeSpan.FromMinutes(1)));
		options.AddPolicy(
			RateLimitPolicyConstants.ClientLogs,
			context =>
				CreateAuthLimiter(
					context,
					settings.ClientLogsPerMinute,
					TimeSpan.FromMinutes(1)));
		options.AddPolicy(
			RateLimitPolicyConstants.MfaVerify,
			context =>
				CreateAuthLimiter(
					context,
					settings.MfaVerifyPerMinute,
					TimeSpan.FromMinutes(1)));
		options.AddPolicy(
			RateLimitPolicyConstants.MfaResend,
			context =>
				CreateAuthLimiter(
					context,
					settings.MfaResendPerMinute,
					TimeSpan.FromMinutes(1)));
	}

	/// <summary>
	/// Creates a fixed window rate limiter for authentication endpoints.
	/// Partitions by client IP address with configurable limits and window duration.
	/// </summary>
	/// <param name="context">
	/// The HTTP context containing the client IP address.
	/// </param>
	/// <param name="permitLimit">
	/// The maximum number of requests allowed per window.
	/// </param>
	/// <param name="window">
	/// The duration of the rate limiting window.
	/// </param>
	/// <returns>
	/// A rate limit partition configured for the specified limits.
	/// </returns>
	private static RateLimitPartition<string> CreateAuthLimiter(
		HttpContext context,
		int permitLimit,
		TimeSpan window) =>
		RateLimitPartition.GetFixedWindowLimiter(
			partitionKey: context.Connection.RemoteIpAddress?.ToString()
				?? RateLimitPartitionKeys.Anonymous,
			factory: _ => new FixedWindowRateLimiterOptions
			{
				PermitLimit = permitLimit,
				Window = window,
				QueueProcessingOrder =
					QueueProcessingOrder.OldestFirst,
				QueueLimit = 0,
			});

	/// <summary>
	/// Creates the handler for rate limit rejection responses.
	/// Returns a 429 Too Many Requests response with RFC 7807 problem details.
	/// </summary>
	/// <param name="settings">
	/// The rate limiting settings containing the retry-after value.
	/// </param>
	/// <returns>
	/// A function that handles rate limit rejections.
	/// </returns>
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

			Microsoft.AspNetCore.Mvc.ProblemDetails problemDetails =
				new()
				{
					Type = ProblemDetailConstants.Types.RateLimit,
					Title = ProblemDetailConstants.Titles.TooManyRequests,
					Status = StatusCodes.Status429TooManyRequests,
					Detail = ProblemDetailConstants.Details.RateLimitExceeded,
					Instance = context.HttpContext.Request.Path,
				};

			problemDetails.Extensions["retryAfter"] =
				settings.RetryAfterSeconds;

			await context.HttpContext.Response.WriteAsJsonAsync(
				problemDetails,
				cancellationToken);
		};
}