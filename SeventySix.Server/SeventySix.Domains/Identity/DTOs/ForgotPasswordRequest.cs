// <copyright file="ForgotPasswordRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Request to initiate a password reset flow.
/// </summary>
/// <remarks>
/// This endpoint accepts any email address and always returns success
/// to prevent email enumeration attacks. The actual email is only sent
/// if the user exists and is active.
/// </remarks>
/// <param name="Email">
/// The email address to send the password reset link to.
/// </param>
public record ForgotPasswordRequest(string Email);