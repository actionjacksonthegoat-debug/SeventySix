// <copyright file="RecaptchaActionConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// reCAPTCHA action name constants.
/// Actions must match between client and server validation.
/// </summary>
/// <remarks>
/// Action names follow reCAPTCHA guidelines:
/// - Only alphanumeric characters, slashes, and underscores
/// - Must not be user-specific
/// </remarks>
public static class RecaptchaActionConstants
{
	/// <summary>
	/// Login action.
	/// </summary>
	public const string Login = "login";

	/// <summary>
	/// Registration action.
	/// </summary>
	public const string Register = "register";

	/// <summary>
	/// Password reset action.
	/// </summary>
	public const string PasswordReset = "password_reset";
}