// <copyright file="IPermissionRequestService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>Service interface for permission request operations.</summary>
public interface IPermissionRequestService
{
	/// <summary>Gets all permission requests (admin only).</summary>
	public Task<IEnumerable<PermissionRequestDto>> GetAllRequestsAsync(
		CancellationToken cancellationToken = default);

	/// <summary>Gets roles available for the user to request.</summary>
	public Task<IEnumerable<AvailableRoleDto>> GetAvailableRolesAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>Creates permission requests for the specified roles.</summary>
	public Task CreateRequestsAsync(
		int userId,
		string username,
		CreatePermissionRequestDto request,
		CancellationToken cancellationToken = default);

	/// <summary>Approves a single permission request. Audit tracked via AuditInterceptor.</summary>
	public Task<bool> ApproveRequestAsync(
		int requestId,
		CancellationToken cancellationToken = default);

	/// <summary>Rejects a single permission request.</summary>
	public Task<bool> RejectRequestAsync(
		int requestId,
		CancellationToken cancellationToken = default);

	/// <summary>Approves multiple permission requests. Audit tracked via AuditInterceptor.</summary>
	public Task<int> ApproveRequestsAsync(
		IEnumerable<int> requestIds,
		CancellationToken cancellationToken = default);

	/// <summary>Rejects multiple permission requests.</summary>
	public Task<int> RejectRequestsAsync(
		IEnumerable<int> requestIds,
		CancellationToken cancellationToken = default);
}