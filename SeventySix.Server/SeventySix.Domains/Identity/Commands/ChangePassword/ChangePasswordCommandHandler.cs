// <copyright file="ChangePasswordCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Wolverine;

namespace SeventySix.Identity;

/// <summary>
/// Handler for changing a user's password.
/// </summary>
public static class ChangePasswordCommandHandler
{
	/// <summary>
	/// Handles the change password command.
	/// </summary>
	/// <exception cref="ArgumentException">Thrown when validation fails.</exception>
	public static async Task<AuthResult> HandleAsync(
		ChangePasswordCommand command,
		UserManager<ApplicationUser> userManager,
		ITokenRepository tokenRepository,
		AuthenticationService authenticationService,
		TimeProvider timeProvider,
		ILogger<ChangePasswordCommand> logger,
		CancellationToken cancellationToken)
	{
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		ApplicationUser user =
			await GetUserOrThrowAsync(
				command.UserId,
				userManager,
				logger);

		await EnsurePasswordChangedAsync(
			command,
			user,
			userManager);

		await ClearRequiresPasswordChangeIfNeededAsync(
			user,
			userManager,
			logger);

		// Revoke all existing refresh tokens
		await tokenRepository.RevokeAllUserTokensAsync(
			command.UserId,
			now,
			cancellationToken);

		return await authenticationService.GenerateAuthResultAsync(
			user,
			clientIp: null,
			requiresPasswordChange: false,
			rememberMe: false,
			cancellationToken);
	}

	/// <summary>
	/// Retrieve a user by ID or throw an <see cref="InvalidOperationException"/> if not found.
	/// </summary>
	private static async Task<ApplicationUser> GetUserOrThrowAsync(
		long userId,
		UserManager<ApplicationUser> userManager,
		ILogger logger)
	{
		ApplicationUser? user =
			await userManager.FindByIdAsync(userId.ToString());

		if (user is null)
		{
			logger.LogError(
				"User with ID {UserId} not found for password change",
				userId);
			throw new InvalidOperationException(
				$"User with ID {userId} not found");
		}

		return user;
	}

	/// <summary>
	/// Change the existing password or add a new password for users without one.
	/// Throws on validation or identity failures.
	/// </summary>
	/// <param name="command">
	/// The change password command.
	/// </param>
	/// <param name="user">
	/// The user whose password is being changed.
	/// </param>
	/// <param name="userManager">
	/// User manager for identity operations.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	private static async Task EnsurePasswordChangedAsync(
		ChangePasswordCommand command,
		ApplicationUser user,
		UserManager<ApplicationUser> userManager)
	{
		bool hasPassword =
			await userManager.HasPasswordAsync(user);

		if (hasPassword)
		{
			if (command.Request.CurrentPassword is null)
			{
				throw new ArgumentException(
					"Current password is required when changing password",
					nameof(command.Request.CurrentPassword));
			}

			// Change password using Identity's built-in method
			IdentityResult changeResult =
				await userManager.ChangePasswordAsync(
					user,
					command.Request.CurrentPassword,
					command.Request.NewPassword);

			if (!changeResult.Succeeded)
			{
				if (changeResult.Errors.Any(
					error =>
						error.Code == "PasswordMismatch"))
				{
					throw new ArgumentException(
						"Current password is incorrect",
						nameof(command.Request.CurrentPassword));
				}

				throw new InvalidOperationException(
					string.Join(
						", ",
						changeResult.Errors.Select(error => error.Description)));
			}
		}
		else
		{
			// User doesn't have a password yet - add one
			IdentityResult addResult =
				await userManager.AddPasswordAsync(
					user,
					command.Request.NewPassword);

			if (!addResult.Succeeded)
			{
				throw new InvalidOperationException(
					string.Join(
						", ",
						addResult.Errors.Select(error => error.Description)));
			}
		}
	}

	/// <summary>
	/// Clears the <c>RequiresPasswordChange</c> flag when present and persists the change.
	/// </summary>
	/// <param name="user">
	/// The user to update.
	/// </param>
	/// <param name="userManager">
	/// User manager for identity operations.
	/// </param>
	/// <param name="logger">
	/// Logger for logging errors.
	/// </param>
	private static async Task ClearRequiresPasswordChangeIfNeededAsync(
		ApplicationUser user,
		UserManager<ApplicationUser> userManager,
		ILogger logger)
	{
		if (user.RequiresPasswordChange)
		{
			user.RequiresPasswordChange = false;
			IdentityResult updateResult =
				await userManager.UpdateAsync(user);

			if (!updateResult.Succeeded)
			{
				string errors = updateResult.ToErrorString();
				logger.LogError(
					"Failed to clear RequiresPasswordChange flag for user {UserId}: {Errors}",
					user.Id,
					errors);
				throw new InvalidOperationException(
					"Failed to update user password change status");
			}
		}
	}
}