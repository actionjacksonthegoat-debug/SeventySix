// <copyright file="IUserCommandRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// User write data access operations.
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
}