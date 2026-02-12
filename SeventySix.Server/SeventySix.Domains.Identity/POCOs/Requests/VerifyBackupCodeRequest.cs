// <copyright file="VerifyBackupCodeRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Request to verify a backup code during MFA.
/// </summary>
/// <param name="ChallengeToken">
/// The MFA challenge token issued during login (proof of password authentication).
/// </param>
/// <param name="Code">
/// The backup code (format: XXXX-XXXX).
/// </param>
/// <param name="TrustDevice">
/// Whether to trust this device and skip MFA on future logins.
/// </param>
public record VerifyBackupCodeRequest(
	string ChallengeToken,
	string Code,
	bool TrustDevice = false);