// <copyright file="MfaAttemptTypes.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Constants for MFA attempt type identifiers used by <see cref="IMfaAttemptTracker"/>.
/// </summary>
public static class MfaAttemptTypes
{
	/// <summary>
	/// TOTP code verification attempts.
	/// </summary>
	public const string Totp = "totp";

	/// <summary>
	/// Backup code verification attempts.
	/// </summary>
	public const string BackupCode = "backup";
}