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
	/// Policy requiring Admin role only.
	/// </summary>
	public const string AdminOnly = "AdminOnly";

	/// <summary>
	/// Policy requiring Developer or Admin role.
	/// </summary>
	public const string DeveloperOrAdmin = "DeveloperOrAdmin";

	/// <summary>
	/// Policy requiring any authenticated user.
	/// </summary>
	public const string Authenticated = "Authenticated";
}