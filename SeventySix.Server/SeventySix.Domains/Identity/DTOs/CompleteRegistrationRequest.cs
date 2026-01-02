// <copyright file="CompleteRegistrationRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Request to complete registration after email verification.
/// </summary>
/// <param name="Email">
/// The email address being verified.
/// </param>
/// <param name="Token">
/// The email verification token from the link.
/// </param>
/// <param name="Username">
/// The desired username.
/// </param>
/// <param name="Password">
/// The desired password.
/// </param>
public record CompleteRegistrationRequest(
	string Email,
	string Token,
	string Username,
	string Password);