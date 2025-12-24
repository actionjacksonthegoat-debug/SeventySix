// <copyright file="PolicyConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity.Constants;

/// <summary>
/// Authorization policy constants for the application.
/// Single source of truth for policy names (DRY).
/// </summary>
public static class PolicyConstants
{
	/// <summary>
	/// Policy requiring Admin or Developer role.
	/// </summary>
	public const string AdminOnly = "AdminOnly";
}