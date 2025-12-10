// <copyright file="CreateUserCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Shared.Extensions;
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
	/// <param name="logger">Logger instance.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The created user DTO.</returns>
	/// <remarks>
	/// Wolverine's UseEntityFrameworkCoreTransactions middleware automatically wraps this handler in a transaction.
	/// Database unique constraints on Username and Email provide atomicity - no manual transaction management needed.
	/// </remarks>
	public static async Task<UserDto> HandleAsync(
		CreateUserCommand command,
		IMessageBus messageBus,
		IValidator<CreateUserRequest> validator,
		IUserQueryRepository userQueryRepository,
		IUserCommandRepository userCommandRepository,
		ILogger logger,
		CancellationToken cancellationToken)
	{
		await validator.ValidateAndThrowAsync(
			command.Request,
			cancellationToken);

		// Create user entity
		User entity =
			command.Request.ToEntity();

		UserDto createdUser;

		try
		{
			User created =
				await userCommandRepository.CreateAsync(
					entity,
					cancellationToken);

			createdUser = created.ToDto();
		}
		catch (DbUpdateException exception) when (exception.IsDuplicateKeyViolation())
		{
			// Database unique constraint violation - check which field caused it
			string message = exception.InnerException?.Message ?? exception.Message;

			if (message.Contains(
				"IX_Users_Username",
				StringComparison.OrdinalIgnoreCase))
			{
				logger.LogWarning(
					"Duplicate username detected during user creation. Username: {Username}",
					command.Request.Username);

				throw new DuplicateUserException(
					$"Failed to create user: Username '{command.Request.Username}' is already taken");
			}

			if (message.Contains(
				"IX_Users_Email",
				StringComparison.OrdinalIgnoreCase))
			{
				logger.LogWarning(
					"Duplicate email detected during user creation. Email: {Email}, Username: {Username}",
					command.Request.Email,
					command.Request.Username);

				throw new DuplicateUserException(
					$"Failed to create user: Email '{command.Request.Email}' is already registered");
			}

			// Unknown constraint violation
			logger.LogWarning(
				"Unknown duplicate key violation during user creation. Username: {Username}, Email: {Email}",
				command.Request.Username,
				command.Request.Email);

			throw new DuplicateUserException(
				"Failed to create user: Username or email already exists");
		}

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
				userQueryRepository,
				userCommandRepository,
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
		IUserQueryRepository userQueryRepository,
		IUserCommandRepository userCommandRepository,
		CancellationToken cancellationToken)
	{
		User? user =
			await userQueryRepository.GetByIdAsync(
				userId,
				cancellationToken);

		if (user == null)
		{
			return;
		}

		user.NeedsPendingEmail = true;

		await userCommandRepository.UpdateAsync(
			user,
			cancellationToken);
	}
}