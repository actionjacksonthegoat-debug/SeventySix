// <copyright file="IPermissionRequestRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>Repository interface for permission request data access.</summary>
public interface IPermissionRequestRepository
{
	/// <summary>Gets all permission requests with user info.</summary>
	Task<IEnumerable<PermissionRequestDto>> GetAllAsync(CancellationToken cancellationToken = default);

	/// <summary>Gets permission requests for a specific user.</summary>
	Task<IEnumerable<PermissionRequest>> GetByUserIdAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>Gets existing roles the user already has (from UserRoles).</summary>
	/// <remarks>Used to hide roles user already has from available roles list.</remarks>
	Task<IEnumerable<string>> GetUserExistingRolesAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>Creates a new permission request.</summary>
	Task CreateAsync(
		PermissionRequest request,
		CancellationToken cancellationToken = default);
}
