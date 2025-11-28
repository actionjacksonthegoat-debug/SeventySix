// <copyright file="IUserRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;

namespace SeventySix.Identity;

/// <summary>User data access operations.</summary>
public interface IUserRepository
{
	public Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default);

	public Task<IEnumerable<UserDto>> GetAllProjectedAsync(CancellationToken cancellationToken = default);

	public Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

	public Task<User> CreateAsync(User user, CancellationToken cancellationToken = default);

	public Task<User> UpdateAsync(User user, CancellationToken cancellationToken = default);

	public Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);

	public Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);

	public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

	public Task<bool> UsernameExistsAsync(string username, int? excludeId = null, CancellationToken cancellationToken = default);

	public Task<bool> EmailExistsAsync(string email, int? excludeId = null, CancellationToken cancellationToken = default);

	public Task<(IEnumerable<User> Users, int TotalCount)> GetPagedAsync(
		UserQueryRequest request,
		CancellationToken cancellationToken = default);

	public Task<(IEnumerable<UserDto> Users, int TotalCount)> GetPagedProjectedAsync(
		UserQueryRequest request,
		CancellationToken cancellationToken = default);

	public Task<IEnumerable<User>> GetByIdsAsync(IEnumerable<int> ids, CancellationToken cancellationToken = default);

	public Task<int> BulkUpdateActiveStatusAsync(IEnumerable<int> ids, bool isActive, CancellationToken cancellationToken = default);

	public Task<bool> SoftDeleteAsync(int id, string deletedBy, CancellationToken cancellationToken = default);

	public Task<bool> RestoreAsync(int id, CancellationToken cancellationToken = default);

	public Task<int> CountAsync(bool? isActive = null, bool includeDeleted = false, CancellationToken cancellationToken = default);
}