// <copyright file="MfaMethod.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// MFA verification method types.
/// </summary>
public enum MfaMethod
{
	/// <summary>
	/// Email-based verification code.
	/// </summary>
	Email = 0,

	/// <summary>
	/// Time-based one-time password (authenticator app).
	/// </summary>
	Totp = 1,

	/// <summary>
	/// One-time backup recovery code.
	/// </summary>
	BackupCode = 2
}