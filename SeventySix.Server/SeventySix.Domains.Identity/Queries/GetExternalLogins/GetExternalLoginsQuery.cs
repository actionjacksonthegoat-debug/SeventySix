// <copyright file="GetExternalLoginsQuery.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Query to get a user's linked external OAuth providers.
/// </summary>
/// <param name="UserId">
/// The user ID to query external logins for.
/// </param>
public record GetExternalLoginsQuery(long UserId);
