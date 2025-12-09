// <copyright file="UpdateUserCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.Extensions.Logging;
using SeventySix.Shared;
using Wolverine;

namespace SeventySix.Identity;

/// <summary>
/// Handler for <see cref="UpdateUserCommand"/>.
/// </summary>
public static class UpdateUserCommandHandler
{
	/// <summary>
	/// Handles user updates with duplicate checks and concurrency handling.
	/// </summary>
	/// <param name="command">The update user command.</param>
	/// <param name="messageBus">Message bus for querying users.</param>
	/// <param name="validator">Request validator.</param>
	/// <param name="repository">User repository.</param>
	/// <param name="transactionManager">Transaction coordinator.</param>
	/// <param name="logger">Logger instance.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The updated user DTO.</returns>
	public static async Task<UserDto> HandleAsync(
		UpdateUserCommand command,
		IMessageBus messageBus,
		IValidator<UpdateUserRequest> validator,
		IUserRepository repository,
		ITransactionManager transactionManager,
		ILogger logger,
		CancellationToken cancellationToken)
	{
		await validator.ValidateAndThrowAsync(
			command.Request,
			cancellationToken);

		return await transactionManager.ExecuteInTransactionAsync(
			async transactionCancellationToken =>
			{
				User? existing =
					await repository.GetByIdAsync(
						command.Request.Id,
						transactionCancellationToken);

				if (existing == null)
				{
					string errorMessage =
						$"Failed to update user: User with ID {command.Request.Id} not found";

					logger.LogError(
						"User not found during update operation. UserId: {UserId}",
						command.Request.Id);

					throw new UserNotFoundException(command.Request.Id);
				}

				// Check for duplicate username (excluding current user)
				if (await messageBus.InvokeAsync<bool>(
					new CheckUsernameExistsQuery(
						command.Request.Username,
						command.Request.Id),
					transactionCancellationToken))
				{
					string errorMessage =
						$"Failed to update user: Username '{command.Request.Username}' is already taken by another user";

					logger.LogError(
						"Duplicate username detected during user update. Username: {Username}, UserId: {UserId}",
						command.Request.Username,
						command.Request.Id);

					throw new DuplicateUserException(errorMessage);
				}

				// Check for duplicate email (excluding current user)
				if (await messageBus.InvokeAsync<bool>(
					new CheckEmailExistsQuery(
						command.Request.Email,
						command.Request.Id),
					transactionCancellationToken))
				{
					string errorMessage =
						$"Failed to update user: Email '{command.Request.Email}' is already registered to another user";

					logger.LogError(
						"Duplicate email detected during user update. Email: {Email}, UserId: {UserId}, Username: {Username}",
						command.Request.Email,
						command.Request.Id,
						command.Request.Username);

					throw new DuplicateUserException(errorMessage);
				}

				// Update entity (audit properties set by AuditInterceptor)
				User user =
					command.Request.ToEntity(existing);

				User updated =
					await repository.UpdateAsync(
						user,
						transactionCancellationToken);

				return updated.ToDto();
			},
			maxRetries: 3,
			cancellationToken);
	}
}