// <copyright file="IUserQueryRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// User query data access operations (read-only).
/// </summary>
public interface IUserQueryRepository
{
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
}