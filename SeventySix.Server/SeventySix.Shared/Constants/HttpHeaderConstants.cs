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
	/// Header indicating the JWT token has expired.
	/// Set by JwtBearerEvents when SecurityTokenExpiredException occurs.
	/// </summary>
	public const string TokenExpired = "X-Token-Expired";
}