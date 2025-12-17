// <copyright file="IUserCommandRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// User command operations (write).
/// CQRS command interface for user data modifications.
/// </summary>
public interface IUserCommandRepository
{
	/// <summary>
	/// Creates a new user.
	/// </summary>
	public Task<User> CreateAsync(
		User user,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Updates an existing user.
	/// </summary>
	public Task<User> UpdateAsync(
		User user,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Hard deletes a user.
	/// </summary>
	public Task<bool> DeleteAsync(
		int id,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Soft deletes a user.
	/// </summary>
	public Task<bool> SoftDeleteAsync(
		int id,
		string deletedBy,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Restores a soft-deleted user.
	/// </summary>
	public Task<bool> RestoreAsync(
		int id,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Bulk updates active status for multiple users.
	/// </summary>
	public Task<int> BulkUpdateActiveStatusAsync(
		IEnumerable<int> ids,
		bool isActive,
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