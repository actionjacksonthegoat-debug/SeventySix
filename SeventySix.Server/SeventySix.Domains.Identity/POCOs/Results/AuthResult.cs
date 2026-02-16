// <copyright file="AuthResult.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Authentication result with tokens or error information.
/// Internal model - not exposed via API (use AuthResponse for API contracts).
/// </summary>
/// <param name="Success">
/// Whether authentication succeeded.
/// </param>
/// <param name="AccessToken">
/// JWT access token (null on failure).
/// </param>
/// <param name="RefreshToken">
/// Refresh token (null on failure).
/// </param>
/// <param name="ExpiresAt">
/// Access token expiration time.
/// </param>
/// <param name="Email">
/// User's email address (null on failure).
/// </param>
/// <param name="FullName">
/// User's full name (null if not set or on failure).
/// </param>
/// <param name="RequiresPasswordChange">
/// Whether user must change password before accessing the app.
/// </param>
/// <param name="RequiresMfa">
/// Whether MFA verification is required to complete authentication.
/// </param>
/// <param name="MfaChallengeToken">
/// Temporary token identifying the MFA challenge (proof of password authentication).
/// </param>
/// <param name="MfaMethod">
/// The MFA method required for verification (null if MFA not required).
/// </param>
/// <param name="AvailableMfaMethods">
/// All available MFA methods for the user (null if MFA not required).
/// </param>
/// <param name="Error">
/// Error message (null on success).
/// </param>
/// <param name="ErrorCode">
/// Error code for client handling.
/// </param>
/// <param name="TrustedDeviceToken">
/// Trusted device token to set as a cookie (null when not applicable).
/// </param>
/// <param name="RememberMe">
/// Whether the user selected the "Remember Me" option during authentication.
/// Used by cookie service to set appropriate cookie expiration.
/// </param>
public record AuthResult(
	bool Success,
	string? AccessToken = null,
	string? RefreshToken = null,
	DateTimeOffset? ExpiresAt = null,
	string? Email = null,
	string? FullName = null,
	bool RequiresPasswordChange = false,
	bool RequiresMfa = false,
	string? MfaChallengeToken = null,
	MfaMethod? MfaMethod = null,
	IReadOnlyList<MfaMethod>? AvailableMfaMethods = null,
	string? Error = null,
	string? ErrorCode = null,
	string? TrustedDeviceToken = null,
	bool RememberMe = false)
{
	/// <summary>
	/// Creates a successful result without tokens (e.g., password change).
	/// </summary>
	/// <returns>
	/// Success result.
	/// </returns>
	public static AuthResult Succeeded() => new(Success: true);

	/// <summary>
	/// Creates a successful authentication result.
	/// </summary>
	/// <param name="accessToken">
	/// The JWT access token.
	/// </param>
	/// <param name="refreshToken">
	/// The refresh token.
	/// </param>
	/// <param name="expiresAt">
	/// Token expiration time.
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
	/// <param name="rememberMe">
	/// Whether the user selected "Remember Me" during authentication.
	/// </param>
	/// <returns>
	/// Success result with tokens.
	/// </returns>
	public static AuthResult Succeeded(
		string accessToken,
		string refreshToken,
		DateTimeOffset expiresAt,
		string email,
		string? fullName,
		bool requiresPasswordChange = false,
		bool rememberMe = false) =>
		new(
			Success: true,
			AccessToken: accessToken,
			RefreshToken: refreshToken,
			ExpiresAt: expiresAt,
			Email: email,
			FullName: fullName,
			RequiresPasswordChange: requiresPasswordChange,
			RememberMe: rememberMe);

	/// <summary>
	/// Creates a result requiring MFA verification.
	/// </summary>
	/// <param name="challengeToken">
	/// Temporary token to identify the MFA challenge (proof of password authentication).
	/// </param>
	/// <param name="email">
	/// User's email (passed through for display masking on the client).
	/// </param>
	/// <param name="mfaMethod">
	/// The preferred MFA method for verification.
	/// </param>
	/// <param name="availableMethods">
	/// All available MFA methods for the user.
	/// </param>
	/// <returns>
	/// MFA-required result.
	/// </returns>
	public static AuthResult MfaRequired(
		string? challengeToken,
		string email,
		MfaMethod mfaMethod = Identity.MfaMethod.Email,
		IReadOnlyList<MfaMethod>? availableMethods = null) =>
		new(
			Success: false,
			RequiresMfa: true,
			MfaChallengeToken: challengeToken,
			MfaMethod: mfaMethod,
			AvailableMfaMethods: availableMethods ?? [mfaMethod],
			Email: email);

	/// <summary>
	/// Creates a failed authentication result.
	/// </summary>
	/// <param name="error">
	/// Error message.
	/// </param>
	/// <param name="errorCode">
	/// Error code for client handling.
	/// </param>
	/// <returns>
	/// Failure result with error details.
	/// </returns>
	public static AuthResult Failed(
		string error,
		string? errorCode = null) =>
		new(
			Success: false,
			Error: error,
			ErrorCode: errorCode);
}

/// <summary>
/// Standard authentication error codes.
/// </summary>
public static class AuthErrorCodes
{
	/// <summary>
	/// Invalid credentials.
	/// </summary>
	public const string InvalidCredentials = "INVALID_CREDENTIALS";

	/// <summary>
	/// Account is locked.
	/// </summary>
	public const string AccountLocked = "ACCOUNT_LOCKED";

	/// <summary>
	/// Account is inactive.
	/// </summary>
	public const string AccountInactive = "ACCOUNT_INACTIVE";

	/// <summary>
	/// Username already exists.
	/// </summary>
	public const string UsernameExists = "USERNAME_EXISTS";

	/// <summary>
	/// Email already exists.
	/// </summary>
	public const string EmailExists = "EMAIL_EXISTS";

	/// <summary>
	/// Invalid or expired refresh token.
	/// </summary>
	public const string InvalidToken = "INVALID_TOKEN";

	/// <summary>
	/// Refresh token reuse detected (potential attack).
	/// </summary>
	public const string TokenReuse = "TOKEN_REUSE";

	/// <summary>
	/// OAuth error occurred.
	/// </summary>
	public const string OAuthError = "OAUTH_ERROR";

	/// <summary>
	/// Password does not meet requirements.
	/// </summary>
	public const string WeakPassword = "WEAK_PASSWORD";

	/// <summary>
	/// Token has expired.
	/// </summary>
	public const string TokenExpired = "TOKEN_EXPIRED";

	/// <summary>
	/// User not found.
	/// </summary>
	public const string UserNotFound = "USER_NOT_FOUND";

	/// <summary>
	/// Password found in known data breaches (OWASP ASVS V2.1.7).
	/// </summary>
	public const string BreachedPassword = "BREACHED_PASSWORD";

	/// <summary>
	/// User must change their password.
	/// </summary>
	public const string PasswordChangeRequired = "PASSWORD_CHANGE_REQUIRED";

	/// <summary>
	/// Weak admin password detected during seeding.
	/// </summary>
	public const string WeakAdminPassword = "WEAK_ADMIN_PASSWORD";

	/// <summary>
	/// Registration process failed.
	/// </summary>
	public const string RegistrationFailed = "REGISTRATION_FAILED";

	/// <summary>
	/// Invalid refresh token family (potential token reuse attack).
	/// </summary>
	public const string InvalidTokenFamily = "INVALID_TOKEN_FAMILY";

	/// <summary>
	/// ALTCHA verification failed.
	/// </summary>
	public const string AltchaFailed = "ALTCHA_FAILED";

	/// <summary>
	/// Email not confirmed.
	/// </summary>
	public const string EmailNotConfirmed = "EMAIL_NOT_CONFIRMED";

	/// <summary>
	/// Password reset token expired or invalid.
	/// </summary>
	public const string InvalidPasswordResetToken = "INVALID_PASSWORD_RESET_TOKEN";

	/// <summary>
	/// Email verification token expired or invalid.
	/// </summary>
	public const string InvalidEmailVerificationToken = "INVALID_EMAIL_VERIFICATION_TOKEN";
}

/// <summary>
/// User-facing authentication error messages.
/// </summary>
public static class AuthErrorMessages
{
	/// <summary>
	/// Invalid credentials message.
	/// </summary>
	public const string InvalidCredentials = "Invalid credentials";

	/// <summary>
	/// Account locked message.
	/// </summary>
	public const string AccountLocked = "Account locked";

	/// <summary>
	/// Account inactive message.
	/// </summary>
	public const string AccountInactive = "Account is inactive";

	/// <summary>
	/// Invalid or expired token message.
	/// </summary>
	public const string InvalidToken = "Invalid or expired token";

	/// <summary>
	/// Too many failed attempts message.
	/// </summary>
	public const string TooManyAttempts = "Too many failed attempts. Please try again later.";
}