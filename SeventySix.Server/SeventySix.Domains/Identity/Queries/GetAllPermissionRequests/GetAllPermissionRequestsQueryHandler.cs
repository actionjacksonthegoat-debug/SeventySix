// <copyright file="GetAllPermissionRequestsQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity.Queries.GetAllPermissionRequests;

/// <summary>
/// Handler for retrieving all pending permission requests.
/// </summary>
public static class GetAllPermissionRequestsQueryHandler
{
	/// <summary>
	/// Handles the query to get all permission requests.
	/// </summary>
	/// <param name="query">The query.</param>
	/// <param name="repository">The permission request repository.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>List of all permission requests.</returns>
	public static async Task<IEnumerable<PermissionRequestDto>> HandleAsync(
		GetAllPermissionRequestsQuery query,
		IPermissionRequestRepository repository,
		CancellationToken cancellationToken)
	{
		return await repository.GetAllAsync(cancellationToken);
	}
}