// <copyright file="IUserRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;

namespace SeventySix.Identity;

/// <summary>User data access operations.</summary>
public interface IUserRepository
{
	Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default);

	Task<IEnumerable<UserDto>> GetAllProjectedAsync(CancellationToken cancellationToken = default);

	Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

	Task<User> CreateAsync(User user, CancellationToken cancellationToken = default);

	Task<User> UpdateAsync(User user, CancellationToken cancellationToken = default);

	Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);

	Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);

	Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

	Task<bool> UsernameExistsAsync(string username, int? excludeId = null, CancellationToken cancellationToken = default);

	Task<bool> EmailExistsAsync(string email, int? excludeId = null, CancellationToken cancellationToken = default);

	Task<(IEnumerable<User> Users, int TotalCount)> GetPagedAsync(
		UserQueryRequest request,
		CancellationToken cancellationToken = default);

	Task<(IEnumerable<UserDto> Users, int TotalCount)> GetPagedProjectedAsync(
		UserQueryRequest request,
		CancellationToken cancellationToken = default);

	Task<IEnumerable<User>> GetByIdsAsync(IEnumerable<int> ids, CancellationToken cancellationToken = default);

	Task<int> BulkUpdateActiveStatusAsync(IEnumerable<int> ids, bool isActive, CancellationToken cancellationToken = default);

	Task<bool> SoftDeleteAsync(int id, string deletedBy, CancellationToken cancellationToken = default);

	Task<bool> RestoreAsync(int id, CancellationToken cancellationToken = default);

	Task<int> CountAsync(bool? isActive = null, bool includeDeleted = false, CancellationToken cancellationToken = default);
}

