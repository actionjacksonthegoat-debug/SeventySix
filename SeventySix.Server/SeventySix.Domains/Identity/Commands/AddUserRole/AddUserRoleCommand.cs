// <copyright file="AddUserRoleCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to add a role to a user.
/// </summary>
/// <param name="UserId">The user ID.</param>
/// <param name="Role">The role name to add.</param>
public record AddUserRoleCommand(
	int UserId,
	string Role);