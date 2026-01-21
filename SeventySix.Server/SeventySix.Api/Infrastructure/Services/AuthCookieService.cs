// <copyright file="AuthCookieService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;
using SeventySix.Api.Configuration;
using SeventySix.Identity;

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Implementation of authentication and OAuth cookie management.
/// </summary>
/// <remarks>
/// Uses IHttpContextAccessor for access to HttpContext in a scoped service.
/// Cookie settings are centralized here for consistency.
/// </remarks>
/// <param name="httpContextAccessor">
/// Provides access to the current HTTP context.
/// </param>
/// <param name="authSettings">
/// Authentication configuration including cookie names.
/// </param>
/// <param name="jwtSettings">
/// JWT settings including token expiration.
/// </param>
public class AuthCookieService(
	IHttpContextAccessor httpContextAccessor,
	IOptions<AuthSettings> authSettings,
	IOptions<JwtSettings> jwtSettings) : IAuthCookieService
{
	/// <summary>
	/// Gets the current HttpContext.
	/// </summary>
	/// <exception cref="InvalidOperationException">
	/// Thrown when HttpContext is not available.
	/// </exception>
	private HttpContext HttpContext =>
		httpContextAccessor.HttpContext
			?? throw new InvalidOperationException(
				"HttpContext is not available.");

	/// <inheritdoc/>
	public void SetRefreshTokenCookie(string refreshToken) =>
		SetSecureCookie(
			authSettings.Value.Cookie.RefreshTokenCookieName,
			refreshToken,
			TimeSpan.FromDays(jwtSettings.Value.RefreshTokenExpirationDays));

	/// <inheritdoc/>
	public string? GetRefreshToken() =>
		HttpContext.Request.Cookies[
			authSettings.Value.Cookie.RefreshTokenCookieName];

	/// <inheritdoc/>
	public void ClearRefreshTokenCookie() =>
		DeleteCookie(authSettings.Value.Cookie.RefreshTokenCookieName);

	/// <inheritdoc/>
	public void SetOAuthStateCookie(string state) =>
		SetSecureCookie(
			authSettings.Value.Cookie.OAuthStateCookieName,
			state,
			TimeSpan.FromMinutes(OAuthConstants.StateCookieExpirationMinutes),
			SameSiteMode.Lax);

	/// <inheritdoc/>
	public string? GetOAuthState() =>
		HttpContext.Request.Cookies[
			authSettings.Value.Cookie.OAuthStateCookieName];

	/// <inheritdoc/>
	public void SetOAuthCodeVerifierCookie(string codeVerifier) =>
		SetSecureCookie(
			authSettings.Value.Cookie.OAuthCodeVerifierCookieName,
			codeVerifier,
			TimeSpan.FromMinutes(OAuthConstants.CodeVerifierCookieExpirationMinutes),
			SameSiteMode.Lax);

	/// <inheritdoc/>
	public string? GetOAuthCodeVerifier() =>
		HttpContext.Request.Cookies[
			authSettings.Value.Cookie.OAuthCodeVerifierCookieName];

	/// <inheritdoc/>
	public void ClearOAuthCookies()
	{
		DeleteCookie(authSettings.Value.Cookie.OAuthStateCookieName);
		DeleteCookie(authSettings.Value.Cookie.OAuthCodeVerifierCookieName);
	}

	/// <inheritdoc/>
	public string GetAllowedOrigin()
	{
		Uri callbackUri =
			new(authSettings.Value.OAuth.ClientCallbackUrl);

		return $"{callbackUri.Scheme}://{callbackUri.Authority}";
	}

	/// <summary>
	/// Sets an HTTP-only secure cookie with the specified settings.
	/// </summary>
	/// <param name="name">
	/// The cookie name.
	/// </param>
	/// <param name="value">
	/// The cookie value.
	/// </param>
	/// <param name="expiration">
	/// Time until cookie expires.
	/// </param>
	/// <param name="sameSite">
	/// SameSite policy (defaults to Strict).
	/// </param>
	private void SetSecureCookie(
		string name,
		string value,
		TimeSpan expiration,
		SameSiteMode sameSite = SameSiteMode.Strict)
	{
		CookieOptions options =
			new()
			{
				HttpOnly = true,
				Secure =
					authSettings.Value.Cookie.SecureCookie,
				SameSite = sameSite,
				Expires =
					DateTimeOffset.UtcNow.Add(expiration),
			};

		HttpContext.Response.Cookies.Append(name, value, options);
	}

	/// <summary>
	/// Deletes a cookie by name.
	/// </summary>
	/// <param name="name">
	/// The cookie name to delete.
	/// </param>
	private void DeleteCookie(string name) =>
		HttpContext.Response.Cookies.Delete(name);
}