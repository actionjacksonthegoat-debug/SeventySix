// <copyright file="AuthSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Authentication settings bound from appsettings.json.
/// All configurable values - no hardcoded magic numbers.
/// </summary>
public record AuthSettings
{
	/// <summary>
	/// Gets OAuth provider configurations.
	/// </summary>
	public OAuthSettings OAuth { get; init; } = new();

	/// <summary>
	/// Gets rate limiting configuration.
	/// </summary>
	public AuthRateLimitSettings RateLimit { get; init; } = new();

	/// <summary>
	/// Gets cookie configuration.
	/// </summary>
	public AuthCookieSettings Cookie { get; init; } = new();

	/// <summary>
	/// Gets password hashing configuration.
	/// </summary>
	public PasswordSettings Password { get; init; } = new();

	/// <summary>
	/// Gets token generation configuration.
	/// </summary>
	public TokenSettings Token { get; init; } = new();

	/// <summary>
	/// Gets account lockout configuration.
	/// </summary>
	public LockoutSettings Lockout { get; init; } = new();
}

/// <summary>
/// Account lockout configuration for brute-force protection.
/// </summary>
public record LockoutSettings
{
	/// <summary>
	/// Gets max failed login attempts before lockout. Default: 5.
	/// </summary>
	public int MaxFailedAttempts { get; init; } = 5;

	/// <summary>
	/// Gets lockout duration in minutes. Default: 15.
	/// </summary>
	public int LockoutDurationMinutes { get; init; } = 15;

	/// <summary>
	/// Gets whether account lockout is enabled. Default: true.
	/// </summary>
	public bool Enabled { get; init; } = true;
}

/// <summary>
/// OAuth settings container.
/// </summary>
public record OAuthSettings
{
	/// <summary>
	/// Gets the client callback URL for OAuth redirects.
	/// </summary>
	public string ClientCallbackUrl { get; init; } = string.Empty;

	/// <summary>
	/// Gets the list of OAuth providers.
	/// </summary>
	public IReadOnlyList<OAuthProviderSettings> Providers { get; init; } = [];
}

/// <summary>
/// Individual OAuth provider configuration.
/// </summary>
public record OAuthProviderSettings
{
	/// <summary>
	/// Gets the provider name (e.g., "GitHub").
	/// </summary>
	public string Provider { get; init; } = string.Empty;

	/// <summary>
	/// Gets OAuth client ID from provider.
	/// </summary>
	public string ClientId { get; init; } = string.Empty;

	/// <summary>
	/// Gets OAuth client secret from provider.
	/// </summary>
	public string ClientSecret { get; init; } = string.Empty;

	/// <summary>
	/// Gets requested OAuth scopes.
	/// </summary>
	public string Scopes { get; init; } = string.Empty;

	/// <summary>
	/// Gets the authorization endpoint URL.
	/// </summary>
	public string AuthorizationEndpoint { get; init; } = string.Empty;

	/// <summary>
	/// Gets the token endpoint URL.
	/// </summary>
	public string TokenEndpoint { get; init; } = string.Empty;

	/// <summary>
	/// Gets the user info endpoint URL.
	/// </summary>
	public string UserInfoEndpoint { get; init; } = string.Empty;

	/// <summary>
	/// Gets the redirect URI for OAuth callback.
	/// </summary>
	public string RedirectUri { get; init; } = string.Empty;
}

/// <summary>
/// Rate limiting configuration for auth endpoints.
/// </summary>
public record AuthRateLimitSettings
{
	/// <summary>
	/// Gets max login attempts per minute. Default: 5.
	/// </summary>
	public int LoginAttemptsPerMinute { get; init; } = 5;

	/// <summary>
	/// Gets max register attempts per hour. Default: 3.
	/// </summary>
	public int RegisterAttemptsPerHour { get; init; } = 3;

	/// <summary>
	/// Gets max token refresh per minute. Default: 10.
	/// </summary>
	public int TokenRefreshPerMinute { get; init; } = 10;
}

/// <summary>
/// Cookie configuration for authentication.
/// </summary>
public record AuthCookieSettings
{
	/// <summary>
	/// Gets refresh token cookie name.
	/// </summary>
	public string RefreshTokenCookieName { get; init; } = "X-Refresh-Token";

	/// <summary>
	/// Gets OAuth state cookie name.
	/// </summary>
	public string OAuthStateCookieName { get; init; } = "X-OAuth-State";

	/// <summary>
	/// Gets OAuth code verifier cookie name for PKCE.
	/// </summary>
	public string OAuthCodeVerifierCookieName { get; init; } =
		"X-OAuth-CodeVerifier";

	/// <summary>
	/// Gets a value indicating whether to use secure cookies.
	/// </summary>
	public bool SecureCookie { get; init; } = true;
}

/// <summary>
/// Password hashing configuration.
/// </summary>
public record PasswordSettings
{
	/// <summary>
	/// Gets minimum password length. Default: 8.
	/// </summary>
	public int MinLength { get; init; } = 8;

	/// <summary>
	/// Gets a value indicating whether uppercase is required.
	/// </summary>
	public bool RequireUppercase { get; init; } = true;

	/// <summary>
	/// Gets a value indicating whether lowercase is required.
	/// </summary>
	public bool RequireLowercase { get; init; } = true;

	/// <summary>
	/// Gets a value indicating whether digit is required.
	/// </summary>
	public bool RequireDigit { get; init; } = true;

	/// <summary>
	/// Gets a value indicating whether special char is required.
	/// </summary>
	public bool RequireSpecialChar { get; init; } = false;

	/// <summary>
	/// Gets BCrypt work factor. Default: 12.
	/// </summary>
	public int WorkFactor { get; init; } = 12;
}

/// <summary>
/// Token generation configuration.
/// Note: Token expiration settings are in JwtSettings to avoid DRY violation.
/// </summary>
public record TokenSettings
{
	/// <summary>
	/// Gets max active refresh tokens per user. Default: 5.
	/// When exceeded, oldest token is automatically revoked.
	/// </summary>
	public int MaxActiveSessionsPerUser { get; init; } = 5;
}