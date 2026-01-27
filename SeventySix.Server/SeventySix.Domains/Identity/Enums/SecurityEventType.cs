// <copyright file="SecurityEventType.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Types of security events tracked for audit logging.
/// </summary>
public enum SecurityEventType
{
	/// <summary>
	/// Successful user login.
	/// </summary>
	LoginSuccess = 1,

	/// <summary>
	/// Failed login attempt (invalid credentials).
	/// </summary>
	LoginFailed = 2,

	/// <summary>
	/// User account locked due to failed attempts.
	/// </summary>
	AccountLocked = 3,

	/// <summary>
	/// User account unlocked (timeout or admin action).
	/// </summary>
	AccountUnlocked = 4,

	/// <summary>
	/// User password changed.
	/// </summary>
	PasswordChanged = 5,

	/// <summary>
	/// Password reset requested.
	/// </summary>
	PasswordResetRequested = 6,

	/// <summary>
	/// Password reset completed.
	/// </summary>
	PasswordResetCompleted = 7,

	/// <summary>
	/// User logged out.
	/// </summary>
	Logout = 8,

	/// <summary>
	/// Refresh token rotated.
	/// </summary>
	TokenRefreshed = 9,

	/// <summary>
	/// Refresh token reuse detected (potential attack).
	/// </summary>
	TokenReuseDetected = 10,

	/// <summary>
	/// Refresh token family revoked.
	/// </summary>
	TokenFamilyRevoked = 11,

	/// <summary>
	/// User registered.
	/// </summary>
	UserRegistered = 12,

	/// <summary>
	/// User profile updated.
	/// </summary>
	ProfileUpdated = 13,

	/// <summary>
	/// User role changed.
	/// </summary>
	RoleChanged = 14,

	/// <summary>
	/// Permission request submitted.
	/// </summary>
	PermissionRequested = 15,

	/// <summary>
	/// Permission request approved.
	/// </summary>
	PermissionApproved = 16,

	/// <summary>
	/// Permission request denied.
	/// </summary>
	PermissionDenied = 17,

	/// <summary>
	/// OAuth login initiated.
	/// </summary>
	OAuthLoginInitiated = 18,

	/// <summary>
	/// OAuth callback received.
	/// </summary>
	OAuthCallbackReceived = 19,

	/// <summary>
	/// ALTCHA challenge failed.
	/// </summary>
	AltchaFailed = 20,

	/// <summary>
	/// Suspicious activity detected.
	/// </summary>
	SuspiciousActivity = 21,

	/// <summary>
	/// MFA verification successful.
	/// </summary>
	MfaSuccess = 22,

	/// <summary>
	/// MFA verification failed (invalid code, expired, etc.).
	/// </summary>
	MfaFailed = 23,

	/// <summary>
	/// MFA verification code resent.
	/// </summary>
	MfaCodeResent = 24,

	/// <summary>
	/// MFA challenge initiated (code sent to user).
	/// </summary>
	MfaChallengeInitiated = 25,

	/// <summary>
	/// TOTP enrollment process was initiated (QR code generated).
	/// </summary>
	TotpEnrollmentInitiated = 35,

	/// <summary>
	/// TOTP authenticator was enrolled for the user.
	/// </summary>
	TotpEnrolled = 26,

	/// <summary>
	/// TOTP authenticator was disabled for the user.
	/// </summary>
	TotpDisabled = 27,

	/// <summary>
	/// TOTP verification succeeded.
	/// </summary>
	TotpVerificationSuccess = 28,

	/// <summary>
	/// TOTP verification failed (invalid code).
	/// </summary>
	TotpVerificationFailed = 29,

	/// <summary>
	/// A backup code was used for MFA verification.
	/// </summary>
	BackupCodeUsed = 30,

	/// <summary>
	/// Backup codes were regenerated (old codes invalidated).
	/// </summary>
	BackupCodesRegenerated = 31,

	/// <summary>
	/// A new trusted device was registered.
	/// </summary>
	TrustedDeviceCreated = 32,

	/// <summary>
	/// A trusted device was used to skip MFA.
	/// </summary>
	TrustedDeviceUsed = 33,

	/// <summary>
	/// A trusted device was revoked by the user.
	/// </summary>
	TrustedDeviceRevoked = 34
}