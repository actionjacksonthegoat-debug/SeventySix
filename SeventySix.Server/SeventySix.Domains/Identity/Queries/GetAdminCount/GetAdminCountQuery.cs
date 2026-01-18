// <copyright file="GetAdminCountQuery.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Query to retrieve the count of users with the Admin role.
/// Used to determine if a user is the last remaining administrator.
/// </summary>
/// <remarks>
/// This query supports the business rule that prevents removing the Admin
/// role from the last admin user. The client uses this count to determine
/// if the Admin role removal option should be disabled.
/// </remarks>
public record GetAdminCountQuery;
