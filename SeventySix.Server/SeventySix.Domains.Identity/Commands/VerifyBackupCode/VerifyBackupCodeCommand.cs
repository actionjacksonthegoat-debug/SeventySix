// <copyright file="VerifyBackupCodeCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to verify a backup code during MFA authentication.
/// </summary>
/// <param name="Request">
/// The verification request containing challenge token and backup code.
/// </param>
/// <param name="UserAgent">
/// Browser User-Agent header for device fingerprinting.
/// </param>
public record VerifyBackupCodeCommand(
	VerifyBackupCodeRequest Request,
	string? UserAgent = null);