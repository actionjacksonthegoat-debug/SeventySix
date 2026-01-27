// <copyright file="InitiateTotpEnrollmentCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to initiate TOTP enrollment for a user.
/// </summary>
/// <param name="UserId">
/// The authenticated user's ID.
/// </param>
public record InitiateTotpEnrollmentCommand(long UserId);