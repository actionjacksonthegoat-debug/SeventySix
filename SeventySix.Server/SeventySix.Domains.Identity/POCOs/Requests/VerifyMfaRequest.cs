// <copyright file="VerifyMfaRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Request to verify MFA code.
/// </summary>
/// <param name="ChallengeToken">
/// The challenge token from initial login.
/// </param>
/// <param name="Code">
/// The 6-digit verification code.
/// </param>
/// <param name="TrustDevice">
/// Whether to trust this device and skip MFA on future logins.
/// </param>
public record VerifyMfaRequest(
	string ChallengeToken,
	string Code,
	bool TrustDevice = false);