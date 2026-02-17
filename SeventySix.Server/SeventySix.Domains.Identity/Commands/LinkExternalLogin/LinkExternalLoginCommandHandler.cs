// <copyright file="LinkExternalLoginCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using SeventySix.Shared.Constants;
using SeventySix.Shared.POCOs;

namespace SeventySix.Identity;

/// <summary>
/// Handles <see cref="LinkExternalLoginCommand"/> to link an OAuth provider to a user account.
/// </summary>
public static class LinkExternalLoginCommandHandler
{
	/// <summary>
	/// Links an external OAuth login to the specified user.
	/// </summary>
	/// <param name="command">
	/// The link command containing user and provider details.
	/// </param>
	/// <param name="userManager">
	/// ASP.NET Core Identity user manager.
	/// </param>
	/// <param name="timeProvider">
	/// Time provider for audit timestamps.
	/// </param>
	/// <returns>
	/// Success or failure result.
	/// </returns>
	public static async Task<Result> HandleAsync(
		LinkExternalLoginCommand command,
		UserManager<ApplicationUser> userManager,
		TimeProvider timeProvider,
		ILogger logger)
	{
		ApplicationUser? user =
			await userManager.FindByIdAsync(
				command.UserId.ToString());

		if (user is null)
		{
			return Result.Failure(ProblemDetailConstants.Details.UserNotFound);
		}

		if (!user.IsActive)
		{
			return Result.Failure(ProblemDetailConstants.Details.UserAccountInactive);
		}

		// Check if another user already has this external login
		ApplicationUser? existingLinked =
			await userManager.FindByLoginAsync(
				command.Provider,
				command.ProviderUserId);

		if (existingLinked is not null)
		{
			return Result.Failure(
				OAuthProviderConstants.ErrorMessages.ExternalLoginAlreadyLinked);
		}

		// Add external login
		UserLoginInfo loginInfo =
			new(
				command.Provider,
				command.ProviderUserId,
				command.Provider);

		IdentityResult result =
			await userManager.AddLoginAsync(user, loginInfo);

		if (!result.Succeeded)
		{
			string errors = result.ToErrorString();
			logger.LogError(
				"Failed to link external login for user {UserId}: {Errors}",
				command.UserId,
				errors);
			return Result.Failure(
				ProblemDetailConstants.Details.ExternalLoginLinkFailed);
		}

		// Sync Display Name if user's is empty
		if (string.IsNullOrEmpty(user.FullName)
			&& !string.IsNullOrEmpty(command.FullName))
		{
			user.FullName = command.FullName;
			user.ModifyDate = timeProvider.GetUtcNow();
			user.ModifiedBy =
				OAuthProviderConstants.GetAuditSource(command.Provider);
			await userManager.UpdateAsync(user);
		}

		return Result.Success();
	}
}
