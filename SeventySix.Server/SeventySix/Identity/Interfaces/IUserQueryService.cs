// <copyright file="IUserQueryService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;

namespace SeventySix.Identity;

/// <summary>
/// User query operations (read-only).
/// </summary>
/// <remarks>
/// Focused service following SRP - handles only user data retrieval.
/// </remarks>
public interface IUserQueryService
{
	/// <summary>
	/// Gets all users.
	/// </summary>
	public Task<IEnumerable<UserDto>> GetAllUsersAsync(
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets a user by ID.
	/// </summary>
	public Task<UserDto?> GetUserByIdAsync(
		int id,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets paged users with filtering and sorting.
	/// </summary>
	public Task<PagedResult<UserDto>> GetPagedUsersAsync(
		UserQueryRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets a user by username.
	/// </summary>
	public Task<UserDto?> GetByUsernameAsync(
		string username,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets a user by email.
	/// </summary>
	public Task<UserDto?> GetByEmailAsync(
		string email,
		CancellationToken cancellationToken = default);
}