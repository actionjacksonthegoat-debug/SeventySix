// <copyright file="SecurityErrorCodes.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Constants;

/// <summary>
/// Constants for security-related error codes.
/// Single source of truth for security error identifiers (DRY).
/// </summary>
public static class SecurityErrorCodes
{
	/// <summary>
	/// Weak admin password detected during seeding.
	/// </summary>
	public const string WeakAdminPassword = "WEAK_ADMIN_PASSWORD";

	/// <summary>
	/// Registration process failed.
	/// </summary>
	public const string RegistrationFailed = "REGISTRATION_FAILED";

	/// <summary>
	/// Account lockout triggered.
	/// </summary>
	public const string AccountLockedOut = "ACCOUNT_LOCKED_OUT";

	/// <summary>
	/// Invalid refresh token family (potential token reuse attack).
	/// </summary>
	public const string InvalidTokenFamily = "INVALID_TOKEN_FAMILY";

	/// <summary>
	/// ALTCHA verification failed.
	/// </summary>
	public const string AltchaFailed = "ALTCHA_FAILED";

	/// <summary>
	/// Invalid credentials provided.
	/// </summary>
	public const string InvalidCredentials = "INVALID_CREDENTIALS";

	/// <summary>
	/// Email not confirmed.
	/// </summary>
	public const string EmailNotConfirmed = "EMAIL_NOT_CONFIRMED";

	/// <summary>
	/// User account is disabled.
	/// </summary>
	public const string AccountDisabled = "ACCOUNT_DISABLED";

	/// <summary>
	/// Password reset token expired or invalid.
	/// </summary>
	public const string InvalidPasswordResetToken = "INVALID_PASSWORD_RESET_TOKEN";

	/// <summary>
	/// Email verification token expired or invalid.
	/// </summary>
	public const string InvalidEmailVerificationToken = "INVALID_EMAIL_VERIFICATION_TOKEN";
}