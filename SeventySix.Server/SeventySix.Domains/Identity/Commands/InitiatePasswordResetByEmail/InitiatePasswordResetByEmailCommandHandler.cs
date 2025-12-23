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
	/// Handles the initiate password reset by email request.
	/// </summary>
	/// <param name="email">
	/// The email address to initiate password reset for.
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
		string email,
		IMessageBus messageBus,
		CancellationToken cancellationToken)
	{
		UserDto? user =
			await messageBus.InvokeAsync<UserDto?>(
				new GetUserByEmailQuery(email),
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