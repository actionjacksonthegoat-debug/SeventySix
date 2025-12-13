// <copyright file="IUserRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// User data access operations (query and command).
/// Consolidated interface combining read and write operations.
/// </summary>
public interface IUserRepository
{
	// ========================================
	// Query Operations (Read)
	// ========================================

	/// <summary>
	/// Gets all users.
	/// </summary>
	public Task<IEnumerable<User>> GetAllAsync(
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets all users projected to DTOs.
	/// </summary>
	public Task<IEnumerable<UserDto>> GetAllProjectedAsync(
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets a user by ID.
	/// </summary>
	public Task<User?> GetByIdAsync(
		int id,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets a user by username.
	/// </summary>
	public Task<User?> GetByUsernameAsync(
		string username,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets a user by email.
	/// </summary>
	public Task<User?> GetByEmailAsync(
		string email,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets users by IDs.
	/// </summary>
	public Task<IEnumerable<User>> GetByIdsAsync(
		IEnumerable<int> ids,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets paged users.
	/// </summary>
	public Task<(IEnumerable<User> Users, int TotalCount)> GetPagedAsync(
		UserQueryRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets paged users projected to DTOs.
	/// </summary>
	public Task<(IEnumerable<UserDto> Users, int TotalCount)> GetPagedProjectedAsync(
		UserQueryRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Counts users with optional filters.
	/// </summary>
	public Task<int> CountAsync(
		bool? isActive = null,
		bool includeDeleted = false,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Checks if a username exists.
	/// </summary>
	public Task<bool> UsernameExistsAsync(
		string username,
		int? excludeId = null,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Checks if an email exists.
	/// </summary>
	public Task<bool> EmailExistsAsync(
		string email,
		int? excludeId = null,
		CancellationToken cancellationToken = default);

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
	/// Gets a user's complete profile with roles and authentication details.
	/// </summary>
	public Task<UserProfileDto?> GetUserProfileAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets all users who need pending password reset emails.
	/// </summary>
	public Task<IEnumerable<UserDto>> GetUsersNeedingEmailAsync(
		CancellationToken cancellationToken = default);

	// ========================================
	// Command Operations (Write)
	// ========================================

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
