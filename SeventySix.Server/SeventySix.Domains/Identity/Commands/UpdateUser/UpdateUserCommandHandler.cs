// <copyright file="UpdateUserCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SeventySix.Shared.Extensions;
using Wolverine;

namespace SeventySix.Identity;

/// <summary>
/// Handler for updating a user.
/// </summary>
public static class UpdateUserCommandHandler
{
	/// <summary>
	/// Handles user updates with duplicate checks and concurrency handling.
	/// </summary>
	/// <param name="request">
	/// The update user request.
	/// </param>
	/// <param name="messageBus">
	/// Message bus for querying users.
	/// </param>
	/// <param name="userQueryRepository">
	/// User query repository.
	/// </param>
	/// <param name="userCommandRepository">
	/// User command repository.
	/// </param>
	/// <param name="logger">
	/// Logger instance.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The updated user DTO.
	/// </returns>
	/// <remarks>
	/// Wolverine's UseEntityFrameworkCoreTransactions middleware automatically wraps this handler in a transaction.
	/// Database unique constraints on Username and Email provide atomicity - no manual transaction management needed.
	/// </remarks>
	public static async Task<UserDto> HandleAsync(
		UpdateUserRequest request,
		IMessageBus messageBus,
		IUserQueryRepository userQueryRepository,
		IUserCommandRepository userCommandRepository,
		ILogger logger,
		CancellationToken cancellationToken)
	{
		User? existing =
			await userQueryRepository.GetByIdAsync(
				request.Id,
				cancellationToken);

		if (existing == null)
		{
			throw new UserNotFoundException(request.Id);
		}

		// Update entity (audit properties set by AuditInterceptor)
		User user =
			request.ToEntity(existing);

		try
		{
			User updated =
				await userCommandRepository.UpdateAsync(
					user,
					cancellationToken);

			return updated.ToDto();
		}
		catch (DbUpdateException exception)
			when (exception.IsDuplicateKeyViolation())
		{
			// Database unique constraint violation - check which field caused it
			string message =
				exception.InnerException?.Message ?? exception.Message;

			if (
				message.Contains(
					"IX_Users_Username",
					StringComparison.OrdinalIgnoreCase))
			{
				logger.LogWarning(
					"Duplicate username detected during user update. Username: {Username}, UserId: {UserId}",
					request.Username,
					request.Id);

				throw new DuplicateUserException(
					$"Failed to update user: Username '{request.Username}' is already taken by another user");
			}

			if (
				message.Contains(
					"IX_Users_Email",
					StringComparison.OrdinalIgnoreCase))
			{
				logger.LogWarning(
					"Duplicate email detected during user update. Email: {Email}, UserId: {UserId}, Username: {Username}",
					request.Email,
					request.Id,
					request.Username);

				throw new DuplicateUserException(
					$"Failed to update user: Email '{request.Email}' is already registered to another user");
			}

			// Unknown constraint violation
			logger.LogWarning(
				"Unknown duplicate key violation during user update. Username: {Username}, Email: {Email}, UserId: {UserId}",
				request.Username,
				request.Email,
				request.Id);

			throw new DuplicateUserException(
				"Failed to update user: Username or email already exists");
		}
	}
}