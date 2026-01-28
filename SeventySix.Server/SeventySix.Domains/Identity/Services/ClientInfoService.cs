// <copyright file="ClientInfoService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Http;

namespace SeventySix.Identity;

/// <summary>
/// Extracts client information from HTTP requests.
/// </summary>
/// <remarks>
/// <para>
/// Centralizes IP address and user agent extraction to avoid duplication (DRY).
/// </para>
/// <para>
/// IP extraction respects X-Forwarded-For when configured for reverse proxy scenarios.
/// The actual forwarded header processing is done by ASP.NET Core's ForwardedHeadersMiddleware.
/// </para>
/// </remarks>
/// <param name="httpContextAccessor">
/// The HTTP context accessor for accessing the current request.
/// </param>
public sealed class ClientInfoService(
	IHttpContextAccessor httpContextAccessor) : IClientInfoService
{
	/// <summary>
	/// Maximum length for user agent strings before truncation.
	/// Matches database column constraint.
	/// </summary>
	private const int MaxUserAgentLength = 500;

	/// <inheritdoc/>
	public string? ExtractClientIp()
	{
		HttpContext? httpContext =
			httpContextAccessor.HttpContext;

		if (httpContext is null)
		{
			return null;
		}

		// ForwardedHeadersMiddleware has already processed X-Forwarded-For
		// RemoteIpAddress contains the correct client IP
		return httpContext.Connection.RemoteIpAddress?.ToString();
	}

	/// <inheritdoc/>
	public string? ExtractUserAgent()
	{
		HttpContext? httpContext =
			httpContextAccessor.HttpContext;

		if (httpContext is null)
		{
			return null;
		}

		string? userAgent =
			httpContext.Request.Headers.UserAgent.ToString();

		// Truncate to max storage length if needed
		if (userAgent is not null && userAgent.Length > MaxUserAgentLength)
		{
			return userAgent[..MaxUserAgentLength];
		}

		return string.IsNullOrWhiteSpace(userAgent) ? null : userAgent;
	}
}