// <copyright file="GetUserProfileQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

/// <summary>
/// Handler for <see cref="GetUserProfileQuery"/>.
/// </summary>
public static class GetUserProfileQueryHandler
{
	/// <summary>
	/// Handles retrieval of a user's profile.
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
	/// The user profile or null if not found.
	/// </returns>
	public static async Task<UserProfileDto?> HandleAsync(
		GetUserProfileQuery query,
		UserManager<ApplicationUser> userManager,
		CancellationToken cancellationToken)
	{
		ApplicationUser? user =
			await userManager.FindByIdAsync(query.UserId.ToString());

		if (user is null)
		{
			return null;
		}

		IList<string> roles =
			await userManager.GetRolesAsync(user);

		IList<UserLoginInfo> logins =
			await userManager.GetLoginsAsync(user);

		bool hasPassword =
			await userManager.HasPasswordAsync(user);

		return new UserProfileDto(
			user.Id,
			user.UserName ?? string.Empty,
			user.Email ?? string.Empty,
			user.FullName,
			roles.ToList(),
			hasPassword,
			logins.Select(login => login.LoginProvider).ToList(),
			user.LastLoginAt);
	}
}