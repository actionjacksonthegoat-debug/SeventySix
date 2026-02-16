// <copyright file="ApplicationRole.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Application role extending ASP.NET Core Identity.
/// </summary>
/// <remarks>
/// Roles are seeded during migration; prefer the constants in `RoleConstants` rather than literal strings.
/// </remarks>
public class ApplicationRole : IdentityRole<long>
{
	/// <summary>
	/// Gets or sets the role description.
	/// </summary>
	public string? Description { get; set; }

	/// <summary>
	/// Gets or sets whether this role is active.
	/// </summary>
	public bool IsActive { get; set; } = true;

	/// <summary>
	/// Gets or sets the creation timestamp.
	/// </summary>
	public DateTimeOffset CreateDate { get; set; }
}