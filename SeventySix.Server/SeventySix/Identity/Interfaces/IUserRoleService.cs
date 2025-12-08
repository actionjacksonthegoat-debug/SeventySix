// <copyright file="IUserRoleService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// User role management operations.
/// </summary>
/// <remarks>
/// Focused service following SRP - handles user role assignments.
/// </remarks>
public interface IUserRoleService
{
	/// <summary>
	/// Gets all roles for a user.
	/// </summary>
	public Task<IEnumerable<string>> GetUserRolesAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Adds a role to a user (admin action).
	/// </summary>
	public Task<bool> AddUserRoleAsync(
		int userId,
		string role,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Removes a role from a user (admin action).
	/// </summary>
	public Task<bool> RemoveUserRoleAsync(
		int userId,
		string role,
		CancellationToken cancellationToken = default);
}