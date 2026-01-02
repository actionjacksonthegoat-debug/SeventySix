// <copyright file="InitiatePasswordResetCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using SeventySix.ElectronicNotifications.Emails;

namespace SeventySix.Identity;

/// <summary>
/// Handler for initiating a password reset using Identity's token providers.
/// </summary>
public static class InitiatePasswordResetCommandHandler
{
	/// <summary>
	/// Handles the initiate password reset command using Identity's GeneratePasswordResetTokenAsync.
	/// </summary>
	/// <param name="command">
	/// The initiate password reset command containing user id and flags.
	/// </param>
	/// <param name="userManager">
	/// Identity <see cref="UserManager{TUser}"/> for token generation.
	/// </param>
	/// <param name="emailService">
	/// Service to send password reset or welcome emails.
	/// </param>
	/// <param name="logger">
	/// Logger instance.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// </returns>
	/// <exception cref="InvalidOperationException">Thrown when user not found or inactive.</exception>
	public static async Task HandleAsync(
		InitiatePasswordResetCommand command,
		UserManager<ApplicationUser> userManager,
		IEmailService emailService,
		ILogger<InitiatePasswordResetCommand> logger,
		CancellationToken cancellationToken)
	{
		ApplicationUser? user =
			await userManager.FindByIdAsync(command.UserId.ToString());

		if (user is null || !user.IsActive)
		{
			logger.LogError(
				"User with ID {UserId} not found or inactive",
				command.UserId);
			throw new InvalidOperationException(
				$"User with ID {command.UserId} not found or inactive");
		}

		// Generate password reset token using Identity's built-in token provider
		string resetToken =
			await userManager.GeneratePasswordResetTokenAsync(user);

		// Create combined token with user ID for the email link
		// Format: {userId}:{resetToken}
		string combinedToken =
			$"{user.Id}:{resetToken}";

		if (command.IsNewUser)
		{
			await emailService.SendWelcomeEmailAsync(
				user.Email!,
				user.UserName!,
				combinedToken,
				cancellationToken);
		}
		else
		{
			await emailService.SendPasswordResetEmailAsync(
				user.Email!,
				user.UserName!,
				combinedToken,
				cancellationToken);
		}
	}
}