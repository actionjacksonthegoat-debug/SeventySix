// <copyright file="OAuthCodeExchangeResult.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Result of OAuth code exchange.
/// </summary>
/// <param name="AccessToken">The JWT access token.</param>
/// <param name="RefreshToken">The refresh token.</param>
/// <param name="ExpiresAt">Access token expiration time.</param>
public record OAuthCodeExchangeResult(
	string AccessToken,
	string RefreshToken,
	DateTime ExpiresAt);
