// <copyright file="InitiatePasswordResetByEmailCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to initiate a password reset via email.
/// </summary>
/// <param name="Request">
/// The forgot password request containing email and ALTCHA payload.
/// </param>
public record InitiatePasswordResetByEmailCommand(ForgotPasswordRequest Request);