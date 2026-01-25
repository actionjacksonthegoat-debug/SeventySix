// <copyright file="VerifyTotpCodeCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to verify TOTP code during MFA authentication.
/// </summary>
/// <param name="Request">
/// The verification request containing email and TOTP code.
/// </param>
/// <param name="ClientIp">
/// Client IP for token creation.
/// </param>
public record VerifyTotpCodeCommand(
	VerifyTotpRequest Request,
	string? ClientIp);