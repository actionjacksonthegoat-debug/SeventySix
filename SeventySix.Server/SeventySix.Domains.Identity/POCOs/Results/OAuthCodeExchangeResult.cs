// <copyright file="OAuthCodeExchangeResult.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Result of OAuth code exchange.
/// </summary>
/// <param name="AccessToken">
/// The JWT access token.
/// </param>
/// <param name="RefreshToken">
/// The refresh token.
/// </param>
/// <param name="ExpiresAt">
/// Access token expiration time.
/// </param>
/// <param name="Email">
/// User's email address.
/// </param>
/// <param name="FullName">
/// User's full name (null if not set).
/// </param>
/// <param name="RequiresPasswordChange">
/// Whether user must change password before accessing resources.
/// </param>
public record OAuthCodeExchangeResult(
	string AccessToken,
	string RefreshToken,
	DateTimeOffset ExpiresAt,
	string Email,
	string? FullName,
	bool RequiresPasswordChange);