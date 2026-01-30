// <copyright file="ConfirmTotpEnrollmentCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to confirm TOTP enrollment by verifying a code.
/// </summary>
/// <param name="UserId">
/// The authenticated user's ID.
/// </param>
/// <param name="Request">
/// The confirmation request containing the TOTP code.
/// </param>
public record ConfirmTotpEnrollmentCommand(
	long UserId,
	ConfirmTotpEnrollmentRequest Request);