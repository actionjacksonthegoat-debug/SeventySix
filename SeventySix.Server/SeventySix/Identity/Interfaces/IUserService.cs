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
}