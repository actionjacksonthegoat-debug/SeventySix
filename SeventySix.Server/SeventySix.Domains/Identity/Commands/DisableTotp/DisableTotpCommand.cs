// <copyright file="DisableTotpCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to disable TOTP authentication for a user.
/// </summary>
/// <param name="UserId">
/// The authenticated user's ID.
/// </param>
/// <param name="Request">
/// The request containing password for verification.
/// </param>
public record DisableTotpCommand(
	long UserId,
	DisableTotpRequest Request);