// <copyright file="CookiePathConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Configuration;

/// <summary>
/// Cookie path scope constants.
/// Narrowing cookie paths reduces the attack surface by ensuring cookies
/// are only transmitted with requests to their intended endpoints.
/// </summary>
public static class CookiePathConstants
{
	/// <summary>
	/// Path scope for the refresh token cookie.
	/// The refresh token is only needed at auth endpoints \u2014 scoping to this
	/// path prevents it from being sent with every API request.
	/// </summary>
	public const string AuthEndpoints = "/api/v1/auth";
}