// <copyright file="ConfirmTotpEnrollmentRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Request to confirm TOTP enrollment by verifying a code.
/// </summary>
/// <param name="Code">
/// The 6-digit TOTP code from authenticator app.
/// </param>
public record ConfirmTotpEnrollmentRequest(string Code);