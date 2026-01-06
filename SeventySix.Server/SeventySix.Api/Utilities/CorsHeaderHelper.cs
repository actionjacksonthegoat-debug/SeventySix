// <copyright file="CorsHeaderHelper.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Middleware;

/// <summary>
/// Small utility to preserve CORS response headers when the request Origin matches
/// configured allowed origins. Kept internal to avoid widening surface area.
/// </summary>
internal static class CorsHeaderHelper
{
	/// <summary>
	/// Adds CORS response headers when the Origin header is present and matches one of the allowed origins.
	/// </summary>
	/// <param name="context">
	/// The current HTTP context.
	/// </param>
	/// <param name="allowedOrigins">
	/// A set of allowed origins (case-insensitive).
	/// </param>
	public static void AddCorsHeadersIfAllowed(
		HttpContext context,
		ISet<string> allowedOrigins)
	{
		string? origin =
			context.Request.Headers.Origin.ToString();

		if (!string.IsNullOrEmpty(origin)
			&& allowedOrigins.Contains(origin))
		{
			context.Response.Headers.AccessControlAllowOrigin = origin;
			context.Response.Headers.AccessControlAllowCredentials = "true";
		}
	}
}