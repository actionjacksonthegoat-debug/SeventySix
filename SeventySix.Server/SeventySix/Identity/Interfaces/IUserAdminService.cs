// <copyright file="IUserAdminService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// User administration operations.
/// </summary>
/// <remarks>
/// Focused service following SRP - handles admin-level user management.
/// </remarks>
public interface IUserAdminService
{
	/// <summary>
	/// Creates a new user.
	/// </summary>
	public Task<UserDto> CreateUserAsync(
		CreateUserRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Updates an existing user.
	/// </summary>
	public Task<UserDto> UpdateUserAsync(
		UpdateUserRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Soft deletes a user.
	/// </summary>
	public Task<bool> DeleteUserAsync(
		int id,
		string deletedBy,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Restores a soft-deleted user.
	/// </summary>
	public Task<bool> RestoreUserAsync(
		int id,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Bulk updates active status for multiple users.
	/// </summary>
	public Task<int> BulkUpdateActiveStatusAsync(
		IEnumerable<int> userIds,
		bool isActive,
		string modifiedBy,
		CancellationToken cancellationToken = default);
}