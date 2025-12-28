// <copyright file="GetUserProfileQuery.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Query to get a user's complete profile with roles and authentication details.
/// </summary>
/// <param name="UserId">
/// The user ID.
/// </param>
public record GetUserProfileQuery(long UserId);