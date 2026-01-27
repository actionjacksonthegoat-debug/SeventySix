// <copyright file="InitiatePasswordResetByEmailCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Wolverine;

namespace SeventySix.Identity;

/// <summary>
/// Handler for initiating password reset by email.
/// </summary>
/// <remarks>
/// Uses silent success pattern - returns success even if user not found to prevent enumeration attacks.
/// Includes ALTCHA Proof-of-Work validation when enabled.
/// </remarks>
public static class InitiatePasswordResetByEmailCommandHandler
{
	/// <summary>
	/// Handles the initiate password reset by email request.
	/// </summary>
	/// <param name="command">
	/// The command containing the forgot password request.
	/// </param>
	/// <param name="altchaService">
	/// Service for ALTCHA Proof-of-Work validation.
	/// </param>
	/// <param name="messageBus">
	/// Message bus.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public static async Task HandleAsync(
		InitiatePasswordResetByEmailCommand command,
		IAltchaService altchaService,
		IMessageBus messageBus,
		CancellationToken cancellationToken)
	{
		// Validate ALTCHA if enabled
		// Silent failure to prevent enumeration attacks
		if (altchaService.IsEnabled)
		{
			AltchaValidationResult altchaResult =
				await altchaService.ValidateAsync(
					command.Request.AltchaPayload ?? string.Empty,
					cancellationToken);

			if (!altchaResult.Success)
			{
				// Silent return - don't reveal validation failure to potential bots
				return;
			}
		}

		UserDto? user =
			await messageBus.InvokeAsync<UserDto?>(
				new GetUserByEmailQuery(command.Request.Email),
				cancellationToken);

		if (user is null || !user.IsActive)
		{
			return;
		}

		await messageBus.InvokeAsync(
			new InitiatePasswordResetCommand(user.Id, IsNewUser: false),
			cancellationToken);
	}
}