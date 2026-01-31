// <copyright file="InitiatePasswordResetCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using SeventySix.Shared.Contracts.Emails;
using SeventySix.Shared.POCOs;
using Wolverine;

namespace SeventySix.Identity;

/// <summary>
/// Handler for initiating a password reset using Identity's token providers.
/// </summary>
public static class InitiatePasswordResetCommandHandler
{
	/// <summary>
	/// Handles the initiate password reset command using Identity's GeneratePasswordResetTokenAsync.
	/// Enqueues the email for async delivery via the email queue.
	/// </summary>
	/// <param name="command">
	/// The initiate password reset command containing user id and flags.
	/// </param>
	/// <param name="userManager">
	/// Identity <see cref="UserManager{TUser}"/> for token generation.
	/// </param>
	/// <param name="messageBus">
	/// Message bus for enqueuing emails.
	/// </param>
	/// <param name="logger">
	/// Logger instance.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A Result indicating success or failure with an error message.
	/// </returns>
	public static async Task<Result> HandleAsync(
		InitiatePasswordResetCommand command,
		UserManager<ApplicationUser> userManager,
		IMessageBus messageBus,
		ILogger<InitiatePasswordResetCommand> logger,
		CancellationToken cancellationToken)
	{
		ApplicationUser? user =
			await userManager.FindByIdAsync(
				command.UserId.ToString());

		if (!user.IsValidForAuthentication())
		{
			logger.LogWarning(
				"Password reset requested for user ID {UserId} but user not found or inactive",
				command.UserId);

			return Result.Failure(
				$"User with ID {command.UserId} not found or inactive");
		}

		// Generate password reset token using Identity's built-in token provider
		string resetToken =
			await userManager.GeneratePasswordResetTokenAsync(
				user);

		// Create combined token with user ID for the email link
		// Format: {userId}:{resetToken}
		string combinedToken =
			$"{user.Id}:{resetToken}";

		// Determine email type based on whether this is a new user or password reset
		string emailType =
			command.IsNewUser
				? EmailTypeConstants.Welcome
				: EmailTypeConstants.PasswordReset;

		// Enqueue the email for async delivery
		string usernameValue =
			user.UserName!;
		Dictionary<string, string> templateData =
			new()
			{
				["username"] = usernameValue,
				["resetToken"] = combinedToken
			};

		await messageBus.InvokeAsync(
			new EnqueueEmailCommand(
				emailType,
				user.Email!,
				user.Id,
				templateData),
			cancellationToken);

		return Result.Success();
	}
}