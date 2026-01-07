// <copyright file="CheckIdentityHealthQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

/// <summary>
/// Handler for checking Identity database health.
/// </summary>
public static class CheckIdentityHealthQueryHandler
{
	/// <summary>
	/// Handles the health check query for the Identity database.
	/// </summary>
	/// <param name="query">
	/// The health check query.
	/// </param>
	/// <param name="userManager">
	/// The user manager for data access.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// True if database is healthy, false otherwise.
	/// </returns>
	public static async Task<bool> HandleAsync(
		CheckIdentityHealthQuery query,
		UserManager<ApplicationUser> userManager,
		CancellationToken cancellationToken)
	{
		try
		{
			_ =
				await userManager
					.Users
					.AsNoTracking()
					.Take(1)
					.ToListAsync(cancellationToken);

			return true;
		}
		catch
		{
			return false;
		}
	}
}