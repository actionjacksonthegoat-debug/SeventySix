// <copyright file="UpdateProfileCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Shared;
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
	/// <param name="transactionManager">Transaction coordinator.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The updated user profile or null if user not found.</returns>
	public static async Task<UserProfileDto?> HandleAsync(
		UpdateProfileCommand command,
		IMessageBus messageBus,
		IValidator<UpdateProfileRequest> validator,
		IUserRepository repository,
		ITransactionManager transactionManager,
		CancellationToken cancellationToken)
	{
		await validator.ValidateAndThrowAsync(
			command.Request,
			cancellationToken);

		User? updatedUser =
			await transactionManager.ExecuteInTransactionAsync(
				async transactionCancellationToken =>
				{
					User? user =
						await repository.GetByIdAsync(
							command.UserId,
							transactionCancellationToken);

					if (user == null)
					{
						return null;
					}

					// Check for duplicate email only if it changed
					if (!string.Equals(
						user.Email,
						command.Request.Email,
						StringComparison.OrdinalIgnoreCase))
					{
						if (await repository.EmailExistsAsync(
							command.Request.Email,
							command.UserId,
							transactionCancellationToken))
						{
							throw new DuplicateUserException(
								$"Email '{command.Request.Email}' is already registered");
						}
					}

					user.Email =
						command.Request.Email;
					user.FullName =
						command.Request.FullName;

					await repository.UpdateAsync(
						user,
						transactionCancellationToken);

					return user;
				},
				maxRetries: 3,
				cancellationToken);

		// Query full profile after transaction commits (avoids AsNoTracking stale data issue)
		if (updatedUser != null)
		{
			return await messageBus.InvokeAsync<UserProfileDto?>(
				new GetUserProfileQuery(command.UserId),
				cancellationToken);
		}

		return null;
	}
}
