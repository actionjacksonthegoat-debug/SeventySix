// <copyright file="ClearPendingEmailFlagCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to clear the pending email flag for a user.
/// </summary>
/// <param name="UserId">
/// The ID of the user to clear the flag for.
/// </param>
public record ClearPendingEmailFlagCommand(long UserId);