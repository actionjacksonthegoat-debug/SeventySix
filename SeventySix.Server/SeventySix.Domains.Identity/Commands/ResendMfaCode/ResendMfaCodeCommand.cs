// <copyright file="ResendMfaCodeCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to resend MFA verification code.
/// </summary>
/// <param name="Request">
/// The resend request containing the challenge token.
/// </param>
public record ResendMfaCodeCommand(ResendMfaCodeRequest Request);