// <copyright file="DeleteUserCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to soft delete a user.
/// </summary>
/// <param name="UserId">The user ID to delete.</param>
/// <param name="DeletedBy">Username of the person deleting the user.</param>
public record DeleteUserCommand(int UserId, string DeletedBy);