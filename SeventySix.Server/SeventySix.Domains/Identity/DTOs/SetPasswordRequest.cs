// <copyright file="SetPasswordRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Request to set a new password using a password reset token.
/// </summary>
/// <remarks>
/// Used for both:
/// - New user welcome flow (initial password setup)
/// - Forgot password flow (password reset).
/// </remarks>
/// <param name="Token">The password reset token (base64 encoded).</param>
/// <param name="NewPassword">The new password to set.</param>
public record SetPasswordRequest(string Token, string NewPassword);