// <copyright file="VerifyBackupCodeCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to verify a backup code during MFA authentication.
/// </summary>
/// <param name="Request">
/// The verification request containing email and backup code.
/// </param>
/// <param name="ClientIp">
/// Client IP for token creation.
/// </param>
public record VerifyBackupCodeCommand(
	VerifyBackupCodeRequest Request,
	string? ClientIp);