// <copyright file="CreateUserCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.Extensions.Logging;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Shared;
using Wolverine;

namespace SeventySix.Identity;

/// <summary>
/// Handler for <see cref="CreateUserCommand"/>.
/// </summary>
public static class CreateUserCommandHandler
{
	/// <summary>
	/// Handles user creation with duplicate checks and welcome email.
	/// </summary>
	/// <param name="command">The create user command.</param>
	/// <param name="messageBus">Message bus for querying users.</param>
	/// <param name="validator">Request validator.</param>
	/// <param name="repository">User repository.</param>
	/// <param name="transactionManager">Transaction coordinator.</param>
	/// <param name="logger">Logger instance.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The created user DTO.</returns>
	public static async Task<UserDto> HandleAsync(
		CreateUserCommand command,
		IMessageBus messageBus,
		IValidator<CreateUserRequest> validator,
		IUserRepository repository,
		ITransactionManager transactionManager,
		ILogger logger,
		CancellationToken cancellationToken)
	{
		await validator.ValidateAndThrowAsync(
			command.Request,
			cancellationToken);

		UserDto createdUser =
			await transactionManager.ExecuteInTransactionAsync(
				async transactionCancellationToken =>
				{
					if (await messageBus.InvokeAsync<bool>(
						new CheckUsernameExistsQuery(
							command.Request.Username,
							null),
						transactionCancellationToken))
					{
						string errorMessage =
							$"Failed to create user: Username '{command.Request.Username}' is already taken";

						logger.LogError(
							"Duplicate username detected during user creation. Username: {Username}",
							command.Request.Username);

						throw new DuplicateUserException(errorMessage);
					}

					if (await messageBus.InvokeAsync<bool>(
						new CheckEmailExistsQuery(
							command.Request.Email,
							null),
						transactionCancellationToken))
					{
						string errorMessage =
							$"Failed to create user: Email '{command.Request.Email}' is already registered";

						logger.LogError(
							"Duplicate email detected during user creation. Email: {Email}, Username: {Username}",
							command.Request.Email,
							command.Request.Username);

						throw new DuplicateUserException(errorMessage);
					}

					User entity =
						command.Request.ToEntity();

					User created =
						await repository.CreateAsync(
							entity,
							transactionCancellationToken);

					return created.ToDto();
				},
				maxRetries: 3,
				cancellationToken);

		// Send welcome email OUTSIDE transaction to avoid rollback on email failure
		try
		{
			await messageBus.InvokeAsync(
				new InitiatePasswordResetCommand(
					createdUser.Id,
					IsNewUser: true),
				cancellationToken);
		}
		catch (EmailRateLimitException ex)
		{
			// Email rate limited - mark user for pending email
			await MarkUserNeedsPendingEmailAsync(
				createdUser.Id,
				repository,
				cancellationToken);

			logger.LogWarning(
				"Email rate limited for user {Email} (ID: {UserId}). Resets in: {TimeUntilReset}",
				createdUser.Email,
				createdUser.Id,
				ex.TimeUntilReset);

			// Re-throw to let controller return appropriate response
			throw;
		}
		catch (Exception ex)
		{
			logger.LogWarning(
				ex,
				"Failed to send welcome email to user {Email} (ID: {UserId}). User was created successfully but will need manual password reset. Error: {ErrorMessage}",
				createdUser.Email,
				createdUser.Id,
				ex.Message);
		}

		return createdUser;
	}

	/// <summary>
	/// Marks a user as needing a pending password reset email.
	/// </summary>
	private static async Task MarkUserNeedsPendingEmailAsync(
		int userId,
		IUserRepository repository,
		CancellationToken cancellationToken)
	{
		User? user =
			await repository.GetByIdAsync(
				userId,
				cancellationToken);

		if (user == null)
		{
			return;
		}

		user.NeedsPendingEmail = true;

		await repository.UpdateAsync(
			user,
			cancellationToken);
	}
}
