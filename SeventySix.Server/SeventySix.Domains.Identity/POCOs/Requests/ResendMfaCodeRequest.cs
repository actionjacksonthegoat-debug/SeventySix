// <copyright file="ResendMfaCodeRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Request to resend MFA verification code.
/// </summary>
/// <param name="ChallengeToken">
/// The challenge token from initial login.
/// </param>
public record ResendMfaCodeRequest(string ChallengeToken);