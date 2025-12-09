// <copyright file="RestoreUserCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to restore a soft-deleted user.
/// </summary>
/// <param name="UserId">The user ID to restore.</param>
public record RestoreUserCommand(int UserId);
