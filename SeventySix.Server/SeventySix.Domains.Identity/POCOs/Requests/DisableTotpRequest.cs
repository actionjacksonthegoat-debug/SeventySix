// <copyright file="DisableTotpRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Request to disable TOTP authentication.
/// </summary>
/// <param name="Password">
/// The user's current password for verification.
/// </param>
public record DisableTotpRequest(string Password);