// <copyright file="GetUsersNeedingEmailQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

/// <summary>
/// Handler for <see cref="GetUsersNeedingEmailQuery"/>.
/// </summary>
public static class GetUsersNeedingEmailQueryHandler
{
	/// <summary>
	/// Handles retrieval of users who need pending emails.
	/// </summary>
	/// <param name="query">
	/// The query.
	/// </param>
	/// <param name="userManager">
	/// User manager.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Collection of users needing emails.
	/// </returns>
	public static async Task<IEnumerable<UserDto>> HandleAsync(
		GetUsersNeedingEmailQuery query,
		UserManager<ApplicationUser> userManager,
		CancellationToken cancellationToken)
	{
		List<ApplicationUser> users =
			await userManager.Users
				.AsNoTracking()
				.Where(user => user.NeedsPendingEmail)
				.ToListAsync(cancellationToken);

		return users.ToDto();
	}
}