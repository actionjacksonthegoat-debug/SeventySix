// <copyright file="UserProfileDto.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// User profile information for authenticated user.
/// </summary>
/// <param name="Id">
/// User ID.
/// </param>
/// <param name="Username">
/// Username.
/// </param>
/// <param name="Email">
/// Email address.
/// </param>
/// <param name="FullName">
/// Full name.
/// </param>
/// <param name="Roles">
/// User roles.
/// </param>
/// <param name="HasPassword">
/// Whether user has local password set.
/// </param>
/// <param name="LinkedProviders">
/// External OAuth providers linked.
/// </param>
/// <param name="LastLoginAt">
/// Last login timestamp.
/// </param>
public record UserProfileDto(
	int Id,
	string Username,
	string Email,
	string? FullName,
	IReadOnlyList<string> Roles,
	bool HasPassword,
	IReadOnlyList<string> LinkedProviders,
	DateTime? LastLoginAt);