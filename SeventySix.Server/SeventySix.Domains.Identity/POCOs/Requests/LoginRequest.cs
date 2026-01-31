// <copyright file="LoginRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Login request with username/email and password.
/// </summary>
/// <param name="UsernameOrEmail">
/// Username or email address.
/// </param>
/// <param name="Password">
/// User's password.
/// </param>
/// <param name="RememberMe">
/// Whether to extend refresh token expiration (default: false).
/// </param>
/// <param name="AltchaPayload">
/// ALTCHA Proof-of-Work payload for bot protection.
/// Required when ALTCHA is enabled in configuration.
/// </param>
public record LoginRequest(
	string UsernameOrEmail,
	string Password,
	bool RememberMe = false,
	string? AltchaPayload = null);