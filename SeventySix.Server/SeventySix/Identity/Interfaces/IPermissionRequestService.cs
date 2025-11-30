// <copyright file="IPermissionRequestService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>Service interface for permission request operations.</summary>
public interface IPermissionRequestService
{
	/// <summary>Gets all permission requests (admin only).</summary>
	Task<IEnumerable<PermissionRequestDto>> GetAllRequestsAsync(
		CancellationToken cancellationToken = default);

	/// <summary>Gets roles available for the user to request.</summary>
	Task<IEnumerable<AvailableRoleDto>> GetAvailableRolesAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>Creates permission requests for the specified roles.</summary>
	Task CreateRequestsAsync(
		int userId,
		string username,
		CreatePermissionRequestDto request,
		CancellationToken cancellationToken = default);
}
