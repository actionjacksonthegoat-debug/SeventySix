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
	/// Configuration section name for binding.
	/// </summary>
	public const string SectionName = "Auth";

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

	/// <summary>
	/// Gets breached password checking configuration (OWASP ASVS V2.1.7).
	/// </summary>
	public BreachedPasswordSettings BreachedPassword { get; init; } = new();

	/// <summary>
	/// Gets session inactivity timeout configuration.
	/// </summary>
	public SessionInactivitySettings SessionInactivity { get; init; } = new();
}

/// <summary>
/// Account lockout configuration for brute-force protection.
/// All numeric values MUST be configured in appsettings.json.
/// </summary>
public record LockoutSettings
{
	/// <summary>
	/// Gets max failed login attempts before lockout.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int MaxFailedAttempts { get; init; }

	/// <summary>
	/// Gets lockout duration in minutes.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int LockoutDurationMinutes { get; init; }

	/// <summary>
	/// Gets whether account lockout is enabled.
	/// </summary>
	public bool Enabled { get; init; }
}

/// <summary>
/// OAuth settings container.
/// </summary>
public record OAuthSettings
{
	/// <summary>
	/// Gets a value indicating whether OAuth authentication is enabled.
	/// When disabled, OAuth login and account linking are unavailable.
	/// </summary>
	public bool Enabled { get; init; }

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
/// All values MUST be configured in appsettings.json.
/// </summary>
public record AuthRateLimitSettings
{
	/// <summary>
	/// Gets max login attempts per minute.
	/// </summary>
	public int LoginAttemptsPerMinute { get; init; }

	/// <summary>
	/// Gets max register attempts per hour.
	/// </summary>
	public int RegisterAttemptsPerHour { get; init; }

	/// <summary>
	/// Gets max token refresh per minute.
	/// </summary>
	public int TokenRefreshPerMinute { get; init; }

	/// <summary>
	/// Gets max ALTCHA challenge requests per minute.
	/// </summary>
	public int AltchaChallengePerMinute { get; init; }

	/// <summary>
	/// Gets max client log submissions per minute.
	/// </summary>
	public int ClientLogsPerMinute { get; init; }

	/// <summary>
	/// Gets max MFA verification attempts per minute.
	/// </summary>
	public int MfaVerifyPerMinute { get; init; }

	/// <summary>
	/// Gets max MFA code resend requests per minute.
	/// </summary>
	public int MfaResendPerMinute { get; init; }
}

/// <summary>
/// Cookie configuration for authentication.
/// Cookie names use string defaults as they are conventional identifiers.
/// </summary>
public record AuthCookieSettings
{
	/// <summary>
	/// Gets refresh token cookie name.
	/// </summary>
	public string RefreshTokenCookieName { get; init; } =
		string.Empty;

	/// <summary>
	/// Gets OAuth state cookie name.
	/// </summary>
	public string OAuthStateCookieName { get; init; } =
		string.Empty;

	/// <summary>
	/// Gets OAuth code verifier cookie name for PKCE.
	/// </summary>
	public string OAuthCodeVerifierCookieName { get; init; } =
		string.Empty;

	/// <summary>
	/// Gets a value indicating whether to use secure cookies.
	/// </summary>
	public bool SecureCookie { get; init; }

	/// <summary>
	/// Gets a value indicating whether to use SameSite=Lax for cookies.
	/// Set to true for E2E testing where client and API are on different ports.
	/// </summary>
	public bool SameSiteLax { get; init; }
}

/// <summary>
/// Password hashing configuration.
/// Numeric values MUST be configured in appsettings.json.
/// </summary>
public record PasswordSettings
{
	/// <summary>
	/// Gets minimum password length.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int MinLength { get; init; }

	/// <summary>
	/// Gets a value indicating whether uppercase is required.
	/// </summary>
	public bool RequireUppercase { get; init; }

	/// <summary>
	/// Gets a value indicating whether lowercase is required.
	/// </summary>
	public bool RequireLowercase { get; init; }

	/// <summary>
	/// Gets a value indicating whether digit is required.
	/// </summary>
	public bool RequireDigit { get; init; }

	/// <summary>
	/// Gets a value indicating whether special char is required.
	/// </summary>
	public bool RequireSpecialChar { get; init; }

	/// <summary>
	/// Gets Argon2id hashing configuration.
	/// </summary>
	public Argon2Settings Argon2 { get; init; } = new();
}

/// <summary>
/// Argon2id password hashing configuration.
/// All values MUST be configured in appsettings.json.
/// </summary>
/// <remarks>
/// <para>
/// OWASP 2024 Recommendations for interactive logins:
/// - Memory: 64 MB (65536 KB) minimum
/// - Iterations: 3 minimum
/// - Parallelism: Match available CPU cores (4 is a good default)
/// </para>
/// <para>
/// These values provide ~100ms hash time on modern hardware,
/// balancing security and user experience.
/// </para>
/// </remarks>
public record Argon2Settings
{
	/// <summary>
	/// Gets memory size in KB.
	/// OWASP minimum: 19456 KB (19 MB). Recommended: 65536 KB (64 MB).
	/// </summary>
	public int MemorySize { get; init; }

	/// <summary>
	/// Gets number of iterations.
	/// OWASP minimum: 2. Recommended: 3.
	/// </summary>
	public int Iterations { get; init; }

	/// <summary>
	/// Gets degree of parallelism (threads).
	/// Should match available CPU cores.
	/// </summary>
	public int DegreeOfParallelism { get; init; }
}

/// <summary>
/// Token generation configuration.
/// Note: Token expiration settings are in JwtSettings to avoid DRY violation.
/// </summary>
public record TokenSettings
{
	/// <summary>
	/// Gets max active refresh tokens per user.
	/// When exceeded, oldest token is automatically revoked.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int MaxActiveSessionsPerUser { get; init; }

	/// <summary>
	/// Gets a value indicating whether to disable token rotation on refresh.
	/// When true, the old refresh token is NOT revoked during rotation.
	/// WARNING: Only enable for E2E testing where the same token must work across contexts.
	/// </summary>
	public bool DisableRotation { get; init; }
}

/// <summary>
/// Breached password checking configuration using HaveIBeenPwned k-Anonymity API.
/// Implements OWASP ASVS V2.1.7: "Verify that passwords submitted during account
/// registration, login, and password change are checked against a set of breached passwords."
/// </summary>
/// <remarks>
/// <para>
/// Uses k-Anonymity model: Only first 5 characters of SHA-1 hash are sent to HIBP API.
/// The actual password never leaves the server, ensuring privacy.
/// </para>
/// <para>
/// API: https://api.pwnedpasswords.com/range/{first5HashChars}
/// Rate limit: No authentication required, but reasonable use expected.
/// </para>
/// </remarks>
public record BreachedPasswordSettings
{
	/// <summary>
	/// Gets a value indicating whether breach checking is enabled.
	/// </summary>
	public bool Enabled { get; init; }

	/// <summary>
	/// Gets the minimum breach count to consider a password compromised.
	/// Set higher (e.g., 10) to allow commonly weak but rarely breached passwords.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int MinBreachCount { get; init; }

	/// <summary>
	/// Gets a value indicating whether to block breached passwords.
	/// When false, only logs a warning but allows registration.
	/// </summary>
	public bool BlockBreachedPasswords { get; init; }

	/// <summary>
	/// Gets the API timeout in milliseconds.
	/// Fail open if API is slow/unavailable.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int ApiTimeoutMs { get; init; }
}

/// <summary>
/// Session inactivity timeout configuration (NIST 800-63B §7.2).
/// </summary>
public record SessionInactivitySettings
{
	/// <summary>
	/// Gets a value indicating whether session inactivity timeout is enabled.
	/// </summary>
	public bool Enabled { get; init; } = true;

	/// <summary>
	/// Gets the minutes of inactivity before session termination.
	/// NIST 800-63B recommends ≤30 minutes for sensitive applications.
	/// </summary>
	public int TimeoutMinutes { get; init; } = 30;

	/// <summary>
	/// Gets the seconds before timeout to show the countdown warning.
	/// </summary>
	public int WarningSeconds { get; init; } = 60;
}