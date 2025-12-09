// <copyright file="GetUserRolesQuery.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Query to get all roles for a user.
/// </summary>
/// <param name="UserId">The user ID.</param>
public record GetUserRolesQuery(int UserId);