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
/// </remarks>
public static class InitiatePasswordResetByEmailCommandHandler
{
	/// <summary>
	/// Handles the initiate password reset by email command.
	/// </summary>
	public static async Task HandleAsync(
		InitiatePasswordResetByEmailCommand command,
		IMessageBus messageBus,
		CancellationToken cancellationToken)
	{
		UserDto? user =
			await messageBus.InvokeAsync<UserDto?>(
				new GetUserByEmailQuery(
					command.Email),
				cancellationToken);

		if (user is null || !user.IsActive)
		{
			return;
		}

		await messageBus.InvokeAsync(
			new InitiatePasswordResetCommand(
				user.Id,
				IsNewUser: false),
			cancellationToken);
	}
}