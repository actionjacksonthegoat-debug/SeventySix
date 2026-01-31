// <copyright file="IClientInfoService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Service for extracting client information from HTTP requests.
/// </summary>
/// <remarks>
/// Provides a single source of truth for IP address and user agent extraction.
/// Respects X-Forwarded-For headers when behind a reverse proxy.
/// </remarks>
public interface IClientInfoService
{
	/// <summary>
	/// Extracts the client IP address from the current HTTP context.
	/// </summary>
	/// <returns>
	/// The client IP address, or null if unavailable.
	/// </returns>
	public string? ExtractClientIp();

	/// <summary>
	/// Extracts the user agent string from the current HTTP context.
	/// </summary>
	/// <returns>
	/// The user agent string, or null if unavailable.
	/// </returns>
	public string? ExtractUserAgent();
}