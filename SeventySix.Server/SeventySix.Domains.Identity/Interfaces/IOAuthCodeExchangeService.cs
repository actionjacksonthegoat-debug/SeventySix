// <copyright file="IOAuthCodeExchangeService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Service for secure OAuth code exchange pattern.
/// </summary>
/// <remarks>
/// Security: Instead of exposing tokens via postMessage, we generate
/// a short-lived one-time code. The client exchanges this code for
/// tokens via a secure API call, preventing token interception.
/// </remarks>
public interface IOAuthCodeExchangeService
{
	/// <summary>
	/// Stores tokens and returns a short-lived authorization code.
	/// </summary>
	/// <param name="accessToken">
	/// The JWT access token.
	/// </param>
	/// <param name="refreshToken">
	/// The refresh token.
	/// </param>
	/// <param name="expiresAt">
	/// Access token expiration time.
	/// </param>
	/// <param name="email">
	/// User's email address.
	/// </param>
	/// <param name="fullName">
	/// User's full name (optional).
	/// </param>
	/// <param name="requiresPasswordChange">
	/// Whether user must change password.
	/// </param>
	/// <returns>
	/// A one-time authorization code (60 seconds TTL).
	/// </returns>
	public string StoreTokens(
		string accessToken,
		string refreshToken,
		DateTimeOffset expiresAt,
		string email,
		string? fullName,
		bool requiresPasswordChange);

	/// <summary>
	/// Exchanges a one-time code for tokens.
	/// Code is invalidated after first use.
	/// </summary>
	/// <param name="code">
	/// The authorization code from postMessage.
	/// </param>
	/// <returns>
	/// Token data if code is valid, null otherwise.
	/// </returns>
	public OAuthCodeExchangeResult? ExchangeCode(string code);
}