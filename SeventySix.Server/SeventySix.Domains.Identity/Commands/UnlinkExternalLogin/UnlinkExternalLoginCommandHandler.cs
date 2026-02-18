// <copyright file="UnlinkExternalLoginCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using SeventySix.Shared.Constants;
using SeventySix.Shared.POCOs;

namespace SeventySix.Identity;

/// <summary>
/// Handles <see cref="UnlinkExternalLoginCommand"/> to unlink an OAuth provider from a user account.
/// </summary>
/// <remarks>
/// Security: Prevents unlinking the last authentication method.
/// If the user has no password and only one external login, unlinking is forbidden.
/// </remarks>
public static class UnlinkExternalLoginCommandHandler
{
	/// <summary>
	/// Unlinks an external OAuth login from the specified user.
	/// </summary>
	/// <param name="command">
	/// The unlink command containing user and provider details.
	/// </param>
	/// <param name="userManager">
	/// ASP.NET Core Identity user manager.
	/// </param>
	/// <returns>
	/// Success or failure result.
	/// </returns>
	public static async Task<Result> HandleAsync(
		UnlinkExternalLoginCommand command,
		UserManager<ApplicationUser> userManager,
		ILogger logger)
	{
		ApplicationUser? user =
			await userManager.FindByIdAsync(
				command.UserId.ToString());

		if (user is null)
		{
			return Result.Failure(ProblemDetailConstants.Details.UserNotFound);
		}

		// Get current external logins
		IList<UserLoginInfo> logins =
			await userManager.GetLoginsAsync(user);

		// Verify the user actually has this provider linked
		UserLoginInfo? targetLogin =
			logins.FirstOrDefault(
				login => string.Equals(
					login.LoginProvider,
					command.Provider,
					StringComparison.OrdinalIgnoreCase));

		if (targetLogin is null)
		{
			return Result.Failure(
				OAuthProviderConstants.ErrorMessages.ExternalLoginNotFound);
		}

		// Prevent lockout: user must have a password OR at least one other external login
		bool hasPassword =
			await userManager.HasPasswordAsync(user);

		int otherLoginCount =
			logins.Count - 1;

		if (!hasPassword && otherLoginCount < 1)
		{
			return Result.Failure(
				OAuthProviderConstants.ErrorMessages.CannotUnlinkLastAuthMethod);
		}

		// Remove external login
		IdentityResult result =
			await userManager.RemoveLoginAsync(
				user,
				targetLogin.LoginProvider,
				targetLogin.ProviderKey);

		if (!result.Succeeded)
		{
			string errors = result.ToErrorString();
			logger.LogError(
				"Failed to unlink external login for user {UserId}: {Errors}",
				command.UserId,
				errors);
			return Result.Failure(
				ProblemDetailConstants.Details.ExternalLoginUnlinkFailed);
		}

		return Result.Success();
	}
}