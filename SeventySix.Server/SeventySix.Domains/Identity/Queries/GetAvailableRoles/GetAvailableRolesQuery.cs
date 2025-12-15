// <copyright file="GetAvailableRolesQuery.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity.Queries.GetAvailableRoles;

/// <summary>
/// Query to retrieve roles available for a user to request.
/// </summary>
/// <param name="UserId">The ID of the user.</param>
public sealed record GetAvailableRolesQuery(int UserId);
