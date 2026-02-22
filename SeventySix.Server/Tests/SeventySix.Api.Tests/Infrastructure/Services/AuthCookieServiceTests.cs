// <copyright file="AuthCookieServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using SeventySix.Api.Infrastructure;
using SeventySix.Identity;
using Shouldly;

namespace SeventySix.Api.Tests.Infrastructure.Services;

/// <summary>
/// Unit tests for <see cref="AuthCookieService"/>.
/// </summary>
/// <remarks>
/// Tests cookie expiration logic including the RememberMe flag.
/// Uses DefaultHttpContext to capture cookie output without a real HTTP server.
/// Follows 80/20 rule — focuses on cookie expiration correctness.
/// </remarks>
public sealed class AuthCookieServiceTests
{
	private const int StandardExpirationDays = 1;
	private const int RememberMeExpirationDays = 14;
	private const string TestRefreshToken = "test-refresh-token-value";
	private const string RefreshTokenCookieName = "refresh_token";

	private readonly DefaultHttpContext HttpContext;
	private readonly IOptions<AuthSettings> AuthSettings;
	private readonly IOptions<JwtSettings> JwtSettings;
	private readonly IOptions<TrustedDeviceSettings> TrustedDeviceSettings;

	public AuthCookieServiceTests()
	{
		HttpContext =
			new DefaultHttpContext();

		AuthSettings =
			Options.Create(
				new AuthSettings
				{
					Cookie =
						new AuthCookieSettings
						{
							RefreshTokenCookieName = RefreshTokenCookieName,
							SecureCookie = true,
							SameSiteLax = false,
						},
				});

		JwtSettings =
			Options.Create(
				new JwtSettings
				{
					RefreshTokenExpirationDays = StandardExpirationDays,
					RefreshTokenRememberMeExpirationDays = RememberMeExpirationDays,
				});

		TrustedDeviceSettings =
			Options.Create(
				new TrustedDeviceSettings());
	}

	private AuthCookieService CreateService(TimeProvider? timeProvider = null)
	{
		IHttpContextAccessor httpContextAccessor =
			new HttpContextAccessor
			{
				HttpContext = HttpContext,
			};

		return new AuthCookieService(
			httpContextAccessor,
			AuthSettings,
			JwtSettings,
			TrustedDeviceSettings,
			timeProvider ?? TimeProvider.System);
	}

	/// <summary>
	/// Proves the bug: SetRefreshTokenCookie always uses standard expiration (1 day)
	/// regardless of any rememberMe preference because the parameter does not exist.
	/// After the fix, this test validates standard (non-RememberMe) expiration.
	/// </summary>
	[Fact]
	public void SetRefreshTokenCookie_WithoutRememberMe_UsesStandardExpiration()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		DateTimeOffset frozenNow = timeProvider.GetUtcNow();
		AuthCookieService service =
			CreateService(timeProvider);

		// Act
		service.SetRefreshTokenCookie(TestRefreshToken);

		// Assert
		IResponseCookies responseCookies =
			HttpContext.Response.Cookies;

		// Read the Set-Cookie header directly to verify expiration
		string? setCookieHeader =
			HttpContext.Response.Headers.SetCookie
				.FirstOrDefault(header =>
					header != null
					&& header.Contains(RefreshTokenCookieName));

		setCookieHeader.ShouldNotBeNull(
			"Refresh token cookie should be set in response headers.");

		// Parse the expires value from the Set-Cookie header
		DateTimeOffset cookieExpires =
			ParseExpiresFromSetCookieHeader(setCookieHeader);

		DateTimeOffset expectedExpiry =
			frozenNow.AddDays(StandardExpirationDays);

		cookieExpires.ShouldBeGreaterThanOrEqualTo(
			expectedExpiry.AddSeconds(-1));
		cookieExpires.ShouldBeLessThanOrEqualTo(
			expectedExpiry.AddSeconds(1));
	}

	/// <summary>
	/// Verifies the cookie is HTTP-only for security.
	/// </summary>
	[Fact]
	public void SetRefreshTokenCookie_Always_SetsHttpOnlyFlag()
	{
		// Arrange
		AuthCookieService service =
			CreateService();

		// Act
		service.SetRefreshTokenCookie(TestRefreshToken);

		// Assert
		string? setCookieHeader =
			HttpContext.Response.Headers.SetCookie
				.FirstOrDefault(header =>
					header != null
					&& header.Contains(RefreshTokenCookieName));

		setCookieHeader.ShouldNotBeNull();
		setCookieHeader.ShouldContain("httponly", Case.Insensitive);
	}

	/// <summary>
	/// Verifies the cookie uses Strict SameSite when SameSiteLax is false.
	/// </summary>
	[Fact]
	public void SetRefreshTokenCookie_WhenSameSiteLaxFalse_UsesStrictSameSite()
	{
		// Arrange
		AuthCookieService service =
			CreateService();

		// Act
		service.SetRefreshTokenCookie(TestRefreshToken);

		// Assert
		string? setCookieHeader =
			HttpContext.Response.Headers.SetCookie
				.FirstOrDefault(header =>
					header != null
					&& header.Contains(RefreshTokenCookieName));

		setCookieHeader.ShouldNotBeNull();
		setCookieHeader.ShouldContain("samesite=strict", Case.Insensitive);
	}

	/// <summary>
	/// Verifies SameSite=Lax is used when configured (e.g., E2E testing).
	/// </summary>
	[Fact]
	public void SetRefreshTokenCookie_WhenSameSiteLaxTrue_UsesLaxSameSite()
	{
		// Arrange
		IOptions<AuthSettings> laxAuthSettings =
			Options.Create(
				new AuthSettings
				{
					Cookie =
						new AuthCookieSettings
						{
							RefreshTokenCookieName = RefreshTokenCookieName,
							SecureCookie = true,
							SameSiteLax = true,
						},
				});

		IHttpContextAccessor httpContextAccessor =
			new HttpContextAccessor
			{
				HttpContext = HttpContext,
			};

		AuthCookieService service =
			new(
				httpContextAccessor,
				laxAuthSettings,
				JwtSettings,
				TrustedDeviceSettings,
				TimeProvider.System);

		// Act
		service.SetRefreshTokenCookie(TestRefreshToken);

		// Assert
		string? setCookieHeader =
			HttpContext.Response.Headers.SetCookie
				.FirstOrDefault(header =>
					header != null
					&& header.Contains(RefreshTokenCookieName));

		setCookieHeader.ShouldNotBeNull();
		setCookieHeader.ShouldContain("samesite=lax", Case.Insensitive);
	}

	/// <summary>
	/// Parses the "expires" value from a Set-Cookie header string.
	/// </summary>
	/// <param name="setCookieHeader">
	/// The full Set-Cookie header value.
	/// </param>
	/// <returns>
	/// The parsed expiration timestamp.
	/// </returns>
	private static DateTimeOffset ParseExpiresFromSetCookieHeader(
		string setCookieHeader)
	{
		// Set-Cookie format: name=value; expires=Thu, 01 Jan 2026 00:00:00 GMT; path=/; ...
		string[] parts =
			setCookieHeader.Split(';');

		string? expiresPart =
			parts.FirstOrDefault(part =>
				part.Trim().StartsWith(
					"expires=",
					StringComparison.OrdinalIgnoreCase));

		expiresPart.ShouldNotBeNull(
			$"Set-Cookie header should contain an 'expires' directive. Header: {setCookieHeader}");

		string expiresValue =
			expiresPart.Trim()["expires=".Length..];

		return DateTimeOffset.Parse(expiresValue);
	}
}