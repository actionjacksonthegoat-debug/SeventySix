// <copyright file="EmailSubjectConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ElectronicNotifications;

/// <summary>
/// Constants for email subject lines.
/// Single source of truth for email subjects (DRY).
/// </summary>
public static class EmailSubjectConstants
{
	/// <summary>
	/// Subject for welcome emails when new users are created.
	/// </summary>
	public const string Welcome = "Welcome to SeventySix - Set Your Password";

	/// <summary>
	/// Subject for password reset request emails.
	/// </summary>
	public const string PasswordReset = "SeventySix - Password Reset Request";

	/// <summary>
	/// Subject for email verification emails.
	/// </summary>
	public const string EmailVerification = "SeventySix - Verify Your Email";
}
