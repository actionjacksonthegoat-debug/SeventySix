// <copyright file="SmartHttpsRedirectionMiddleware.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;
using SeventySix.Api.Configuration;
using SeventySix.Shared.Constants;

namespace SeventySix.Api.Middleware;

/// <summary>
/// Smart HTTPS redirection middleware with configurable exemptions for observability endpoints.
/// This is the centralized enforcement point for HTTPS policies.
/// </summary>
/// <remarks>
/// <para><b>Design Philosophy:</b></para>
/// <para>
/// Rather than using UseHttpsRedirection() which redirects everything, this middleware
/// provides fine-grained control over which endpoints require HTTPS based on
/// centralized configuration in settings.
/// </para>
///
/// <para><b>Exempted Endpoints (Configurable):</b></para>
/// <list type="bullet">
/// <item>/metrics - Prometheus scraping (often requires HTTP)</item>
/// <item>/health - Container health checks and load balancers</item>
/// <item>/openapi, /scalar - API documentation in development</item>
/// </list>
///
/// <para><b>Behavior:</b></para>
/// <para>
/// When EnforceHttps is true and the request is HTTP:
/// - Check if the path matches an allowed exemption
/// - If exempted and allowed, continue to next middleware
/// - If not exempted, redirect to HTTPS with 307 (Temporary Redirect)
/// </para>
/// </remarks>
/// <param name="next">
/// The next middleware in the pipeline.
/// </param>
/// <param name="securitySettings">
/// Security settings from configuration.
/// </param>
public sealed class SmartHttpsRedirectionMiddleware(
	RequestDelegate next,
	IOptions<SecuritySettings> securitySettings)
{
	/// <summary>
	/// Invokes the HTTPS redirection middleware.
	/// </summary>
	/// <param name="context">
	/// The HTTP context.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	public async Task InvokeAsync(HttpContext context)
	{
		SecuritySettings settings = securitySettings.Value;

		// If HTTPS enforcement is disabled, pass through
		if (!settings.EnforceHttps)
		{
			await next(context);
			return;
		}

		// If request is already HTTPS, pass through
		if (context.Request.IsHttps)
		{
			await next(context);
			return;
		}

		// Check for exempted endpoints
		string path =
			context.Request.Path.Value?.ToLowerInvariant() ?? string.Empty;

		// Metrics endpoint exemption
		if (path.StartsWith(EndpointPathConstants.Metrics) && settings.AllowHttpForMetrics)
		{
			await next(context);
			return;
		}

		// Health check endpoint exemption
		if (path.StartsWith(EndpointPathConstants.Health.Base) && settings.AllowHttpForHealthChecks)
		{
			await next(context);
			return;
		}

		// OpenAPI/Swagger endpoint exemption
		if (
			(path.StartsWith(EndpointPathConstants.OpenApi) || path.StartsWith(EndpointPathConstants.Scalar))
			&& settings.AllowHttpForOpenApi)
		{
			await next(context);
			return;
		}

		// Not exempted - redirect to HTTPS
		string host =
			context.Request.Host.Host;

		if (!IsRequestHostAllowed(host, settings))
		{
			context.Response.StatusCode =
				StatusCodes.Status400BadRequest;
			return;
		}

		string? queryString =
			context.Request.QueryString.HasValue
			? context.Request.QueryString.Value
			: null;

		string redirectUrl =
			settings.HttpsPort == 443
				? $"https://{host}{path}{queryString}"
				: $"https://{host}:{settings.HttpsPort}{path}{queryString}";

		context.Response.Redirect(redirectUrl, permanent: false); // 307 Temporary Redirect
	}

	/// <summary>
	/// Validates that the request host is in the list of allowed hosts.
	/// An empty <see cref="SecuritySettings.AllowedHosts"/> list permits all hosts.
	/// </summary>
	/// <param name="host">
	/// The request host to validate.
	/// </param>
	/// <param name="settings">
	/// Security settings containing the allowed hosts list.
	/// </param>
	/// <returns>
	/// <c>true</c> if the host is allowed or no restriction is configured; otherwise, <c>false</c>.
	/// </returns>
	private static bool IsRequestHostAllowed(string host, SecuritySettings settings)
	{
		if (settings.AllowedHosts.Count == 0)
		{
			return true;
		}

		return settings.AllowedHosts.Any(
			allowedHost => string.Equals(
				allowedHost,
				host,
				StringComparison.OrdinalIgnoreCase));
	}
}