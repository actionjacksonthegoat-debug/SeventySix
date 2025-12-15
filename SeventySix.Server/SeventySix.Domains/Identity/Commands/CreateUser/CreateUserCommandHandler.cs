// <copyright file="CreateUserCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Shared.Extensions;
using Wolverine;

namespace SeventySix.Identity;

/// <summary>
/// Handler for <see cref="CreateUserRequest"/>.
/// </summary>
public static class CreateUserCommandHandler
{
	/// <summary>
	/// Handles user creation with duplicate checks and welcome email.
	/// </summary>
	/// <param name="request">The create user request.</param>
	/// <param name="messageBus">Message bus for querying users.</param>
	/// <param name="userQueryRepository">User query repository.</param>
	/// <param name="userCommandRepository">User command repository.</param>
	/// <param name="logger">Logger instance.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The created user DTO.</returns>
	/// <remarks>
	/// Wolverine's UseEntityFrameworkCoreTransactions middleware automatically wraps this handler in a transaction.
	/// Database unique constraints on Username and Email provide atomicity - no manual transaction management needed.
	/// </remarks>
	public static async Task<UserDto> HandleAsync(
		CreateUserRequest request,
		IMessageBus messageBus,
		IUserQueryRepository userQueryRepository,
		IUserCommandRepository userCommandRepository,
		ILogger logger,
		CancellationToken cancellationToken)
	{
		// Create user entity
		User entity = request.ToEntity();

		UserDto createdUser;

		try
		{
			User created =
				await userCommandRepository.CreateAsync(
					entity,
					cancellationToken);

			createdUser = created.ToDto();
		}
		catch (DbUpdateException exception)
			when (exception.IsDuplicateKeyViolation())
		{
			DuplicateKeyViolationHandler.HandleAsException(
				exception,
				request.Username,
				request.Email,
				logger);

			// Unreachable because HandleAsException always throws
			throw;
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

		await userCommandRepository.UpdateAsync(user, cancellationToken);
	}
}
