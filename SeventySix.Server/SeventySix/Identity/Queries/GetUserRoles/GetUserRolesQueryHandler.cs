// <copyright file="GetUserRolesQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Handler for GetUserRolesQuery.
/// </summary>
public static class GetUserRolesQueryHandler
{
	/// <summary>
	/// Handles the GetUserRolesQuery request.
	/// </summary>
	public static async Task<IEnumerable<string>> HandleAsync(
		GetUserRolesQuery query,
		IUserQueryRepository userQueryRepository,
		CancellationToken cancellationToken)
	{
		return await userQueryRepository.GetUserRolesAsync(
			query.UserId,
			cancellationToken);
	}
}