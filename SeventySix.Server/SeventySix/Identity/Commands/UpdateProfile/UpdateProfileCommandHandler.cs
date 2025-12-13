// <copyright file="UpdateProfileCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using SeventySix.Shared.Extensions;
using Wolverine;

namespace SeventySix.Identity;

/// <summary>
/// Handler for <see cref="UpdateProfileCommand"/>.
/// </summary>
public static class UpdateProfileCommandHandler
{
	/// <summary>
	/// Handles user profile update with duplicate email check.
	/// </summary>
	/// <param name="command">The update profile command.</param>
	/// <param name="messageBus">Message bus for querying updated profile.</param>
	/// <param name="validator">Request validator.</param>
	/// <param name="repository">User repository.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The updated user profile or null if user not found.</returns>
	/// <remarks>
	/// Wolverine's UseEntityFrameworkCoreTransactions middleware automatically wraps this handler in a transaction.
	/// Database unique constraint on Email provides atomicity - no manual transaction management needed.
	/// </remarks>
	public static async Task<UserProfileDto?> HandleAsync(
		UpdateProfileCommand command,
		IMessageBus messageBus,
		IUserQueryRepository userQueryRepository,
		IUserCommandRepository userCommandRepository,
		CancellationToken cancellationToken)
	{
		User? user =
			await userQueryRepository.GetByIdAsync(
				command.UserId,
				cancellationToken);

		if (user == null)
		{
			return null;
		}

		user.Email =
			command.Request.Email;
		user.FullName =
			command.Request.FullName;

		try
		{
			await userCommandRepository.UpdateAsync(
				user,
				cancellationToken);

			// Query full profile after successful update
			return await messageBus.InvokeAsync<UserProfileDto?>(
				new GetUserProfileQuery(command.UserId),
				cancellationToken);
		}
		catch (DbUpdateException exception) when (exception.IsDuplicateKeyViolation())
		{
			// Database unique constraint violation on email
			throw new DuplicateUserException(
				$"Email '{command.Request.Email}' is already registered");
		}
	}
}