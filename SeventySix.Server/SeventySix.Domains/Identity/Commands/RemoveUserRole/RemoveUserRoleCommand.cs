// <copyright file="RemoveUserRoleCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to remove a role from a user.
/// </summary>
/// <param name="UserId">The user ID.</param>
/// <param name="Role">The role name to remove.</param>
public record RemoveUserRoleCommand(int UserId, string Role);