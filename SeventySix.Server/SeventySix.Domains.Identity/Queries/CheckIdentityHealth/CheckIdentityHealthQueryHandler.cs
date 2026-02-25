// <copyright file="CheckIdentityHealthQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Data.Common;
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
			// Use AnyAsync for health checks - more efficient than Take(1)
			// and avoids EF Core warning about Skip/Take without OrderBy
			_ =
				await userManager
					.Users
					.AsNoTracking()
					.AnyAsync(cancellationToken);

			return true;
		}
		catch (DbException)
		{
			return false;
		}
	}
}