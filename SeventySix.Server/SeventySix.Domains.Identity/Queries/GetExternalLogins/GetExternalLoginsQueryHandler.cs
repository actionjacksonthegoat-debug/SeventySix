// <copyright file="GetExternalLoginsQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Handles <see cref="GetExternalLoginsQuery"/> to retrieve a user's linked external providers.
/// </summary>
public static class GetExternalLoginsQueryHandler
{
	/// <summary>
	/// Returns the list of external logins for the specified user.
	/// </summary>
	/// <param name="query">
	/// The query containing the user ID.
	/// </param>
	/// <param name="userManager">
	/// ASP.NET Core Identity user manager.
	/// </param>
	/// <returns>
	/// A list of external login DTOs, or empty list if user not found.
	/// </returns>
	public static async Task<IReadOnlyList<ExternalLoginDto>> HandleAsync(
		GetExternalLoginsQuery query,
		UserManager<ApplicationUser> userManager)
	{
		ApplicationUser? user =
			await userManager.FindByIdAsync(
				query.UserId.ToString());

		if (user is null)
		{
			return [];
		}

		IList<UserLoginInfo> logins =
			await userManager.GetLoginsAsync(user);

		return logins
			.Select(login => new ExternalLoginDto(
				login.LoginProvider,
				login.ProviderDisplayName ?? login.LoginProvider))
			.ToList()
			.AsReadOnly();
	}
}
