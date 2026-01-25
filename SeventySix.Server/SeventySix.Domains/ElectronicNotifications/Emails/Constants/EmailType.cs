// <copyright file="EmailType.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Constants for email types supported by the queue.
/// </summary>
/// <remarks>
/// Each type maps to a specific email template and required template data.
/// </remarks>
public static class EmailType
{
	/// <summary>
	/// Welcome email sent to new users with password setup link.
	/// Required template data: username, resetToken.
	/// </summary>
	public const string Welcome = "Welcome";

	/// <summary>
	/// Password reset email with reset link.
	/// Required template data: username, resetToken.
	/// </summary>
	public const string PasswordReset = "PasswordReset";

	/// <summary>
	/// Email verification for self-registration.
	/// Required template data: verificationToken.
	/// </summary>
	public const string Verification = "Verification";

	/// <summary>
	/// MFA verification code email.
	/// Required template data: code, expirationMinutes.
	/// </summary>
	public const string MfaVerification = "MfaVerification";
}