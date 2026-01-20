// <copyright file="RegisterRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Registration request for new user account.
/// </summary>
/// <param name="Username">
/// Desired username.
/// </param>
/// <param name="Email">
/// Email address.
/// </param>
/// <param name="Password">
/// Password.
/// </param>
/// <param name="FullName">
/// Optional full name.
/// </param>
/// <param name="RecaptchaToken">
/// reCAPTCHA v3 token for bot protection.
/// Required when reCAPTCHA is enabled in configuration.
/// </param>
public record RegisterRequest(
	string Username,
	string Email,
	string Password,
	string? FullName = null,
	string? RecaptchaToken = null);