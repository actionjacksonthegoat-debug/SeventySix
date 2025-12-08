// <copyright file="IUserRoleRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// User role data access operations.
/// </summary>
public interface IUserRoleRepository
{
	/// <summary>
	/// Gets all roles for a user.
	/// </summary>
	public Task<IEnumerable<string>> GetUserRolesAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Checks if a user has a specific role.
	/// </summary>
	public Task<bool> HasRoleAsync(
		int userId,
		string role,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Adds a role to a user.
	/// </summary>
	public Task AddRoleAsync(
		int userId,
		string role,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Adds a role without audit tracking.
	/// </summary>
	public Task AddRoleWithoutAuditAsync(
		int userId,
		string role,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Removes a role from a user.
	/// </summary>
	public Task<bool> RemoveRoleAsync(
		int userId,
		string role,
		CancellationToken cancellationToken = default);
}