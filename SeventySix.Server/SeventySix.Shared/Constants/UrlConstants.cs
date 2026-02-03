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
	/// Localhost URL patterns.
	/// </summary>
	public static class Localhost
	{
		/// <summary>
		/// HTTPS localhost base format. Use: string.Format(HttpsBase, port).
		/// </summary>
		public const string HttpsBase = "https://localhost:{0}";

		/// <summary>
		/// HTTP localhost base format. Use: string.Format(HttpBase, port).
		/// </summary>
		public const string HttpBase = "http://localhost:{0}";
	}
}