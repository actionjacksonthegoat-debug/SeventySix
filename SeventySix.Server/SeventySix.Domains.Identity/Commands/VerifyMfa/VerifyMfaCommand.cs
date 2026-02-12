// <copyright file="VerifyMfaCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to verify MFA code and complete authentication.
/// </summary>
/// <param name="Request">
/// The verification request containing challenge token and code.
/// </param>
/// <param name="ClientIp">
/// Client IP for token creation.
/// </param>
/// <param name="UserAgent">
/// Browser User-Agent header for device fingerprinting.
/// </param>
public record VerifyMfaCommand(
	VerifyMfaRequest Request,
	string? ClientIp,
	string? UserAgent = null);