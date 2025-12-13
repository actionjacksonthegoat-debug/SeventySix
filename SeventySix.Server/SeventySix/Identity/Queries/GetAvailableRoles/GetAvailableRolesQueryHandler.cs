// <copyright file="GetAvailableRolesQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Identity.Constants;

namespace SeventySix.Identity.Queries.GetAvailableRoles;

/// <summary>
/// Handler for retrieving roles available for a user to request.
/// </summary>
public static class GetAvailableRolesQueryHandler
{
	/// <summary>
	/// Handles the query to get available roles for a user.
	/// </summary>
	/// <param name="query">The query containing user ID.</param>
	/// <param name="repository">The permission request repository.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>List of available roles the user can request.</returns>
	public static async Task<IEnumerable<AvailableRoleDto>> HandleAsync(
		GetAvailableRolesQuery query,
		IPermissionRequestRepository repository,
		CancellationToken cancellationToken)
	{
		IEnumerable<string> existingRoles =
			await repository.GetUserExistingRolesAsync(
				query.UserId,
				cancellationToken);

		IEnumerable<PermissionRequest> pendingRequests =
			await repository.GetByUserIdAsync(
				query.UserId,
				cancellationToken);

		HashSet<string> excludedRoles =
			existingRoles
				.Concat(
					pendingRequests.Select(
						request =>
							request.RequestedRole!.Name))
				.ToHashSet(StringComparer.OrdinalIgnoreCase);

		return RoleConstants.AllRequestableRoles
			.Where(
				role =>
					!excludedRoles.Contains(role.Name))
			.ToList();
	}
}
