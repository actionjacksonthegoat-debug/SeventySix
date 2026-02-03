// <copyright file="UrlConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Constants;

/// <summary>
/// URL pattern constants for configuration.
/// Use with string.Format() or interpolation.
/// </summary>
public static class UrlConstants
{
	/// <summary>
	/// API URL patterns.
	/// </summary>
	public static class Api
	{
		/// <summary>
		/// API version path segment.
		/// </summary>
		public const string VersionPath = "/api/v1";

		/// <summary>
		/// Health check endpoint path.
		/// </summary>
		public const string HealthPath = "/health";
	}

	/// <summary>
	/// URL format patterns for building URLs from configuration values.
	/// Host and port values must come from configuration, not hardcoded.
	/// </summary>
	public static class UrlPatterns
	{
		/// <summary>
		/// HTTPS URL format. Usage: string.Format(HttpsFormat, host, port).
		/// </summary>
		public const string HttpsFormat = "https://{0}:{1}";

		/// <summary>
		/// HTTP URL format. Usage: string.Format(HttpFormat, host, port).
		/// </summary>
		public const string HttpFormat = "http://{0}:{1}";
	}
}