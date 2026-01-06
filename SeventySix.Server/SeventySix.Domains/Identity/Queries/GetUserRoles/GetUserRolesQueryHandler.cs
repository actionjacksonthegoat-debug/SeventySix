// <copyright file="GetUserRolesQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Handler for GetUserRolesQuery.
/// </summary>
public static class GetUserRolesQueryHandler
{
	/// <summary>
	/// Handles the GetUserRolesQuery request.
	/// </summary>
	/// <summary>
	/// Returns the role names assigned to a user by identifier.
	/// </summary>
	public static async Task<IEnumerable<string>> HandleAsync(
		GetUserRolesQuery query,
		UserManager<ApplicationUser> userManager,
		CancellationToken cancellationToken)
	{
		ApplicationUser? user =
			await userManager.FindByIdAsync(
				query.UserId.ToString());

		if (user is null)
		{
			return [];
		}

		return await userManager.GetRolesAsync(user);
	}
}