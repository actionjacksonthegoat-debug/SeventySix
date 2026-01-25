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
	SuspiciousActivity = 21
}
