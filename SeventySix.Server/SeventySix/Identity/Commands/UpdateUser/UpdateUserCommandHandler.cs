// <copyright file="UpdateUserCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SeventySix.Shared.Extensions;
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
	/// <param name="logger">Logger instance.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The updated user DTO.</returns>
	/// <remarks>
	/// Wolverine's UseEntityFrameworkCoreTransactions middleware automatically wraps this handler in a transaction.
	/// Database unique constraints on Username and Email provide atomicity - no manual transaction management needed.
	/// </remarks>
	public static async Task<UserDto> HandleAsync(
		UpdateUserCommand command,
		IMessageBus messageBus,
		IValidator<UpdateUserRequest> validator,
		IUserRepository repository,
		ILogger logger,
		CancellationToken cancellationToken)
	{
		await validator.ValidateAndThrowAsync(
			command.Request,
			cancellationToken);

		User? existing =
			await repository.GetByIdAsync(
				command.Request.Id,
				cancellationToken);

		if (existing == null)
		{
			throw new UserNotFoundException(command.Request.Id);
		}

		// Update entity (audit properties set by AuditInterceptor)
		User user =
			command.Request.ToEntity(existing);

		try
		{
			User updated =
				await repository.UpdateAsync(
					user,
					cancellationToken);

			return updated.ToDto();
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
					"Duplicate username detected during user update. Username: {Username}, UserId: {UserId}",
					command.Request.Username,
					command.Request.Id);

				throw new DuplicateUserException(
					$"Failed to update user: Username '{command.Request.Username}' is already taken by another user");
			}

			if (message.Contains(
				"IX_Users_Email",
				StringComparison.OrdinalIgnoreCase))
			{
				logger.LogWarning(
					"Duplicate email detected during user update. Email: {Email}, UserId: {UserId}, Username: {Username}",
					command.Request.Email,
					command.Request.Id,
					command.Request.Username);

				throw new DuplicateUserException(
					$"Failed to update user: Email '{command.Request.Email}' is already registered to another user");
			}

			// Unknown constraint violation
			logger.LogWarning(
				"Unknown duplicate key violation during user update. Username: {Username}, Email: {Email}, UserId: {UserId}",
				command.Request.Username,
				command.Request.Email,
				command.Request.Id);

			throw new DuplicateUserException(
				"Failed to update user: Username or email already exists");
		}
	}
}