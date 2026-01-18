// <copyright file="GetAdminCountQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using SeventySix.Identity.Constants;

namespace SeventySix.Identity;

/// <summary>
/// Handler for <see cref="GetAdminCountQuery"/>.
/// Returns the count of users assigned to the Admin role.
/// </summary>
/// <remarks>
/// This handler supports the last-admin protection business rule.
/// The count is used by clients to determine if Admin role removal
/// should be disabled for a given user.
///
/// Caching Note:
/// This query is not cached because:
/// - Admin count changes are infrequent but critical
/// - Stale counts could allow removing the last admin
/// - The query is simple and performant
/// </remarks>
public static class GetAdminCountQueryHandler
{
	/// <summary>
	/// Returns the count of users with the Admin role.
	/// </summary>
	/// <param name="query">
	/// The query instance (unused but required by Wolverine convention).
	/// </param>
	/// <param name="userManager">
	/// The ASP.NET Identity user manager.
	/// </param>
	/// <returns>
	/// The count of users with the Admin role.
	/// </returns>
	public static async Task<int> HandleAsync(
		GetAdminCountQuery query,
		UserManager<ApplicationUser> userManager)
	{
		IList<ApplicationUser> adminUsers =
			await userManager.GetUsersInRoleAsync(RoleConstants.Admin);

		return adminUsers.Count;
	}
}