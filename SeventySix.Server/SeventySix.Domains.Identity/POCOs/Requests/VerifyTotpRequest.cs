// <copyright file="VerifyTotpRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Request to verify TOTP code during MFA.
/// </summary>
/// <param name="ChallengeToken">
/// The MFA challenge token issued during login (proof of password authentication).
/// </param>
/// <param name="Code">
/// The 6-digit TOTP code from authenticator app.
/// </param>
/// <param name="TrustDevice">
/// Whether to trust this device and skip MFA on future logins.
/// </param>
public record VerifyTotpRequest(
	string ChallengeToken,
	string Code,
	bool TrustDevice = false);