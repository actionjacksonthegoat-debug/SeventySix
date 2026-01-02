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

		ApplicationUser? user =
			await userManager.FindByIdAsync(command.UserId.ToString());

		if (user is null)
		{
			logger.LogError(
				"User with ID {UserId} not found for password change",
				command.UserId);
			throw new InvalidOperationException(
				$"User with ID {command.UserId} not found");
		}

		// Check if user has a password set
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
				if (changeResult.Errors.Any(error =>
					error.Code == "PasswordMismatch"))
				{
					throw new ArgumentException(
						"Current password is incorrect",
						nameof(command.Request.CurrentPassword));
				}

				throw new InvalidOperationException(
					string.Join(", ", changeResult.Errors.Select(error => error.Description)));
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
					string.Join(", ", addResult.Errors.Select(error => error.Description)));
			}
		}

		// Clear the requires-password-change flag and persist the change
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
}