// <copyright file="IUserService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;

namespace SeventySix.Identity;

/// <summary>User business logic operations.</summary>
public interface IUserService
{
	Task<IEnumerable<UserDto>> GetAllUsersAsync(CancellationToken cancellationToken = default);

	Task<UserDto?> GetUserByIdAsync(int id, CancellationToken cancellationToken = default);

	Task<UserDto> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default);

	Task<UserDto> UpdateUserAsync(UpdateUserRequest request, CancellationToken cancellationToken = default);

	Task<bool> DeleteUserAsync(int id, string deletedBy, CancellationToken cancellationToken = default);

	Task<bool> RestoreUserAsync(int id, CancellationToken cancellationToken = default);

	Task<PagedResult<UserDto>> GetPagedUsersAsync(UserQueryRequest request, CancellationToken cancellationToken = default);

	Task<UserDto?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);

	Task<UserDto?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

	Task<bool> UsernameExistsAsync(string username, int? excludeUserId = null, CancellationToken cancellationToken = default);

	Task<bool> EmailExistsAsync(string email, int? excludeUserId = null, CancellationToken cancellationToken = default);

	Task<int> BulkUpdateActiveStatusAsync(IEnumerable<int> userIds, bool isActive, string modifiedBy, CancellationToken cancellationToken = default);
}

