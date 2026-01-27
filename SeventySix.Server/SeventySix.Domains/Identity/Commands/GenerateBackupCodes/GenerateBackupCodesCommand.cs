// <copyright file="GenerateBackupCodesCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to generate new backup codes for a user.
/// </summary>
/// <param name="UserId">
/// The authenticated user's ID.
/// </param>
public record GenerateBackupCodesCommand(long UserId);