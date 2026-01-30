// <copyright file="VerifyBackupCodeRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Request to verify a backup code during MFA.
/// </summary>
/// <param name="Email">
/// The user's email to identify the MFA session.
/// </param>
/// <param name="Code">
/// The backup code (format: XXXX-XXXX).
/// </param>
public record VerifyBackupCodeRequest(
	string Email,
	string Code);