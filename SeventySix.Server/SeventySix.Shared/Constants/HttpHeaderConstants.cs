// <copyright file="HttpHeaderConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Constants;

/// <summary>
/// HTTP header constants for custom headers used across the application.
/// </summary>
public static class HttpHeaderConstants
{
	/// <summary>
	/// Authorization header name.
	/// </summary>
	public const string Authorization = "Authorization";

	/// <summary>
	/// Content-Type header name.
	/// </summary>
	public const string ContentType = "Content-Type";

	/// <summary>
	/// Accept header name.
	/// </summary>
	public const string Accept = "Accept";

	/// <summary>
	/// X-Requested-With header name for AJAX detection.
	/// </summary>
	public const string XRequestedWith = "X-Requested-With";

	/// <summary>
	/// Header indicating the JWT token has expired.
	/// Set by JwtBearerEvents when SecurityTokenExpiredException occurs.
	/// </summary>
	public const string TokenExpired = "X-Token-Expired";
}