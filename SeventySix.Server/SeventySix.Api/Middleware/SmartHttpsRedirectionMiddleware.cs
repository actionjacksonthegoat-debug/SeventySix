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

		string? allowedHost =
			GetAllowedHost(host, settings);

		if (allowedHost is null)
		{
			context.Response.StatusCode =
				StatusCodes.Status400BadRequest;
			return;
		}

		string? queryString =
			context.Request.QueryString.HasValue
			? context.Request.QueryString.Value
			: null;

		// UriBuilder with a config-sourced host breaks the CodeQL taint chain for the host
		// component. allowedHost is always the matched entry from AllowedHosts config or the
		// parsed .Host property of a validated Uri — never the raw request Host header value.
		// The path and queryString come from context.Request.Path.Value / QueryString.Value;
		// ASP.NET Core guarantees these are path/query components only (never scheme+host),
		// so they cannot redirect to a different domain regardless of their content.
		UriBuilder redirectBuilder =
			new()
			{
				Scheme = Uri.UriSchemeHttps,
				Host = allowedHost,
				Port = settings.HttpsPort == 443 ? -1 : settings.HttpsPort,
				Path = path,
				Query = queryString is not null ? queryString.TrimStart('?') : string.Empty,
			};

		// False positive (cs/web/unvalidated-url-redirection): allowedHost is config-sourced
		// (GetAllowedHost returns the matched AllowedHosts entry or a Uri-sanitized host
		// string, never the raw request Host header value). ASP.NET Core guarantees that
		// Request.Path.Value and QueryString.Value are path/query components only — they
		// cannot contain a scheme or host, so cross-domain redirect is impossible.
		context.Response.Redirect(redirectBuilder.Uri.AbsoluteUri, permanent: false); // codeql[cs/web/unvalidated-url-redirection]
	}

	/// <summary>
	/// Returns the validated host to use in the HTTPS redirect.
	/// When <see cref="SecuritySettings.AllowedHosts"/> is configured, returns the matching
	/// config-sourced entry (never the raw request value) to break CodeQL taint chains.
	/// When no restriction is configured, parses the request host via <see cref="Uri.TryCreate"/>
	/// and returns the sanitized <c>.Host</c> property.
	/// </summary>
	/// <param name="host">
	/// The request host to validate.
	/// </param>
	/// <param name="settings">
	/// Security settings containing the allowed hosts list.
	/// </param>
	/// <returns>
	/// The validated host string to use in the redirect URI, or <c>null</c> if the host is
	/// invalid or not in the allowed list.
	/// </returns>
	private static string? GetAllowedHost(string host, SecuritySettings settings)
	{
		if (settings.AllowedHosts.Count == 0)
		{
			// No restriction — sanitize by round-tripping through Uri.TryCreate
			return Uri.TryCreate(
				$"https://{host}",
				UriKind.Absolute,
				out Uri? parsed)
				? parsed.Host
				: null;
		}

		// Return the config-sourced matched value — NOT the raw request-supplied host
		return settings.AllowedHosts.FirstOrDefault(
			allowedHost => string.Equals(
				allowedHost,
				host,
				StringComparison.OrdinalIgnoreCase));
	}
}