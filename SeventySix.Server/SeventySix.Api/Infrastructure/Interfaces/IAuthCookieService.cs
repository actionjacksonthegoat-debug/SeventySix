// <copyright file="IAuthCookieService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Service for managing authentication and OAuth cookies.
/// </summary>
/// <remarks>
/// Abstracts cookie operations from controllers for:
/// - Testability (can mock cookie operations)
/// - Single Responsibility (controllers focus on HTTP flow)
/// - Consistency (all cookie operations go through one service)
/// </remarks>
public interface IAuthCookieService
{
	/// <summary>
	/// Sets the refresh token as an HTTP-only secure cookie.
	/// </summary>
	/// <param name="refreshToken">
	/// The refresh token value.
	/// </param>
	/// <param name="rememberMe">
	/// When true, uses extended cookie expiration (RememberMe days).
	/// When false, uses standard short-lived expiration.
	/// </param>
	public void SetRefreshTokenCookie(
		string refreshToken,
		bool rememberMe = false);

	/// <summary>
	/// Gets the refresh token from the request cookies.
	/// </summary>
	/// <returns>
	/// The refresh token if present; otherwise null.
	/// </returns>
	public string? GetRefreshToken();

	/// <summary>
	/// Clears the refresh token cookie.
	/// </summary>
	public void ClearRefreshTokenCookie();

	/// <summary>
	/// Sets the OAuth state cookie for CSRF protection.
	/// </summary>
	/// <param name="state">
	/// The state value for CSRF validation.
	/// </param>
	public void SetOAuthStateCookie(string state);

	/// <summary>
	/// Gets the OAuth state from the request cookies.
	/// </summary>
	/// <returns>
	/// The state value if present; otherwise null.
	/// </returns>
	public string? GetOAuthState();

	/// <summary>
	/// Sets the OAuth code verifier cookie for PKCE flow.
	/// </summary>
	/// <param name="codeVerifier">
	/// The PKCE code verifier.
	/// </param>
	public void SetOAuthCodeVerifierCookie(string codeVerifier);

	/// <summary>
	/// Gets the OAuth code verifier from the request cookies.
	/// </summary>
	/// <returns>
	/// The code verifier if present; otherwise null.
	/// </returns>
	public string? GetOAuthCodeVerifier();

	/// <summary>
	/// Clears all OAuth-related cookies.
	/// </summary>
	public void ClearOAuthCookies();

	/// <summary>
	/// Gets the allowed origin for OAuth postMessage communication.
	/// </summary>
	/// <returns>
	/// The origin URL (scheme + authority).
	/// </returns>
	public string GetAllowedOrigin();

	/// <summary>
	/// Sets the trusted device token as an HTTP-only secure cookie.
	/// </summary>
	/// <param name="token">
	/// The trusted device token value.
	/// </param>
	/// <param name="lifetimeDays">
	/// Number of days until the cookie expires.
	/// </param>
	public void SetTrustedDeviceCookie(
		string token,
		int lifetimeDays);

	/// <summary>
	/// Gets the trusted device token from the request cookies.
	/// </summary>
	/// <returns>
	/// The trusted device token if present; otherwise null.
	/// </returns>
	public string? GetTrustedDeviceToken();

	/// <summary>
	/// Clears the trusted device cookie.
	/// </summary>
	public void ClearTrustedDeviceCookie();
}