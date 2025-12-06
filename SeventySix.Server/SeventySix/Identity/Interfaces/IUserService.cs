// <copyright file="IUserService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;

namespace SeventySix.Identity;

/// <summary>User business logic operations.</summary>
public interface IUserService
{
	public Task<IEnumerable<UserDto>> GetAllUsersAsync(CancellationToken cancellationToken = default);

	public Task<UserDto?> GetUserByIdAsync(int id, CancellationToken cancellationToken = default);

	public Task<UserDto> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default);

	public Task<UserDto> UpdateUserAsync(UpdateUserRequest request, CancellationToken cancellationToken = default);

	public Task<bool> DeleteUserAsync(int id, string deletedBy, CancellationToken cancellationToken = default);

	public Task<bool> RestoreUserAsync(int id, CancellationToken cancellationToken = default);

	public Task<PagedResult<UserDto>> GetPagedUsersAsync(UserQueryRequest request, CancellationToken cancellationToken = default);

	public Task<UserDto?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);

	public Task<UserDto?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

	public Task<bool> UsernameExistsAsync(string username, int? excludeUserId = null, CancellationToken cancellationToken = default);

	public Task<bool> EmailExistsAsync(string email, int? excludeUserId = null, CancellationToken cancellationToken = default);

	public Task<int> BulkUpdateActiveStatusAsync(IEnumerable<int> userIds, bool isActive, string modifiedBy, CancellationToken cancellationToken = default);

	/// <summary>Gets roles for a user.</summary>
	public Task<IEnumerable<string>> GetUserRolesAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>Adds a role to a user (admin action). Audit tracked.</summary>
	public Task<bool> AddUserRoleAsync(
		int userId,
		string role,
		CancellationToken cancellationToken = default);

	/// <summary>Removes a role from a user (admin action).</summary>
	public Task<bool> RemoveUserRoleAsync(
		int userId,
		string role,
		CancellationToken cancellationToken = default);

	/// <summary>Gets a user's complete profile with roles and authentication details.</summary>
	/// <param name="userId">The ID of the user.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The user profile, or null if user not found.</returns>
	public Task<UserProfileDto?> GetUserProfileAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>Updates the current user's profile (self-service).</summary>
	/// <param name="userId">The ID of the user to update.</param>
	/// <param name="request">The profile update request.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The updated user profile, or null if user not found.</returns>
	public Task<UserProfileDto?> UpdateProfileAsync(
		int userId,
		UpdateProfileRequest request,
		CancellationToken cancellationToken = default);
}