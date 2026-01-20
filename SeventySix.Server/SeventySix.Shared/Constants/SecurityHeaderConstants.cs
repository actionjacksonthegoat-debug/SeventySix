// <copyright file="SecurityHeaderConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Constants;

/// <summary>
/// Constants for HTTP security headers.
/// Single source of truth for security header names and values (DRY).
/// </summary>
public static class SecurityHeaderConstants
{
	/// <summary>
	/// Header names for security headers.
	/// </summary>
	public static class Names
	{
		/// <summary>
		/// X-Content-Type-Options header name.
		/// </summary>
		public const string ContentTypeOptions = "X-Content-Type-Options";

		/// <summary>
		/// X-Frame-Options header name.
		/// </summary>
		public const string FrameOptions = "X-Frame-Options";

		/// <summary>
		/// X-XSS-Protection header name.
		/// </summary>
		public const string XssProtection = "X-XSS-Protection";

		/// <summary>
		/// Content-Security-Policy header name.
		/// </summary>
		public const string ContentSecurityPolicy = "Content-Security-Policy";

		/// <summary>
		/// Referrer-Policy header name.
		/// </summary>
		public const string ReferrerPolicy = "Referrer-Policy";

		/// <summary>
		/// Permissions-Policy header name.
		/// </summary>
		public const string PermissionsPolicy = "Permissions-Policy";

		/// <summary>
		/// Strict-Transport-Security header name.
		/// </summary>
		public const string StrictTransportSecurity = "Strict-Transport-Security";
	}

	/// <summary>
	/// Standard values for security headers.
	/// </summary>
	public static class Values
	{
		/// <summary>
		/// X-Content-Type-Options nosniff value.
		/// </summary>
		public const string NoSniff = "nosniff";

		/// <summary>
		/// X-Frame-Options DENY value.
		/// </summary>
		public const string Deny = "DENY";

		/// <summary>
		/// X-XSS-Protection enabled with block mode.
		/// </summary>
		public const string XssBlock = "1; mode=block";

		/// <summary>
		/// HSTS max age in seconds (1 year).
		/// </summary>
		public const int HstsMaxAgeSeconds = 31536000;
	}
}