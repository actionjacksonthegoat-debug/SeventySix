// <copyright file="VerifyTotpCodeCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to verify TOTP code during MFA authentication.
/// </summary>
/// <param name="Request">
/// The verification request containing challenge token and TOTP code.
/// </param>
/// <param name="ClientIp">
/// Client IP for token creation.
/// </param>
/// <param name="UserAgent">
/// Browser User-Agent header for device fingerprinting.
/// </param>
public record VerifyTotpCodeCommand(
	VerifyTotpRequest Request,
	string? ClientIp,
	string? UserAgent = null);