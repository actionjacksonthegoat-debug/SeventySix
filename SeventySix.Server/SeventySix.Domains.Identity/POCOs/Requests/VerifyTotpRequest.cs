// <copyright file="VerifyTotpRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Request to verify TOTP code during MFA.
/// </summary>
/// <param name="Email">
/// The user's email to identify the MFA session.
/// </param>
/// <param name="Code">
/// The 6-digit TOTP code from authenticator app.
/// </param>
public record VerifyTotpRequest(
	string Email,
	string Code);