// <copyright file="IPermissionRequestRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>Repository interface for permission request data access.</summary>
public interface IPermissionRequestRepository
{
	/// <summary>Gets all permission requests with user info.</summary>
	public Task<IEnumerable<PermissionRequestDto>> GetAllAsync(
		CancellationToken cancellationToken = default);

	/// <summary>Gets a permission request by ID.</summary>
	public Task<PermissionRequest?> GetByIdAsync(
		int id,
		CancellationToken cancellationToken = default);

	/// <summary>Gets multiple permission requests by IDs.</summary>
	public Task<IEnumerable<PermissionRequest>> GetByIdsAsync(
		IEnumerable<int> ids,
		CancellationToken cancellationToken = default);

	/// <summary>Gets permission requests for a specific user.</summary>
	public Task<IEnumerable<PermissionRequest>> GetByUserIdAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>Gets existing roles the user already has (from UserRoles).</summary>
	/// <remarks>Used to hide roles user already has from available roles list.</remarks>
	public Task<IEnumerable<string>> GetUserExistingRolesAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>Gets user email by ID (for whitelist check).</summary>
	public Task<string?> GetUserEmailAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>Creates a new permission request.</summary>
	public Task CreateAsync(
		PermissionRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>Deletes a permission request (handled).</summary>
	public Task DeleteAsync(
		int id,
		CancellationToken cancellationToken = default);

	/// <summary>Deletes multiple permission requests (bulk handled).</summary>
	public Task DeleteRangeAsync(
		IEnumerable<int> ids,
		CancellationToken cancellationToken = default);

	/// <summary>Deletes requests matching user and role (cleanup on direct role add).</summary>
	public Task DeleteByUserAndRoleAsync(
		int userId,
		string role,
		CancellationToken cancellationToken = default);

	/// <summary>Gets the role ID for a given role name.</summary>
	/// <param name="roleName">
	/// The role name to look up.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The role ID, or null if not found.
	/// </returns>
	public Task<int?> GetRoleIdByNameAsync(
		string roleName,
		CancellationToken cancellationToken = default);
}