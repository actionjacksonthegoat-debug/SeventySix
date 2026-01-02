// <copyright file="UpdateUserCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
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
	/// <param name="request">The update user request.</param>
	/// <param name="messageBus">Message bus for querying users.</param>
	/// <param name="userManager">Identity UserManager for user operations.</param>
	/// <param name="logger">Logger instance.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The updated user DTO.</returns>
	/// <remarks>
	/// Wolverine's UseEntityFrameworkCoreTransactions middleware automatically wraps this handler in a transaction.
	/// Database unique constraints on UserName and Email provide atomicity - no manual transaction management needed.
	/// </remarks>
	public static async Task<UserDto> HandleAsync(
		UpdateUserRequest request,
		IMessageBus messageBus,
		UserManager<ApplicationUser> userManager,
		ILogger logger,
		CancellationToken cancellationToken)
	{
		ApplicationUser? existing =
			await userManager.FindByIdAsync(request.Id.ToString());

		if (existing == null)
		{
			throw new UserNotFoundException(request.Id);
		}

		existing.UserName = request.Username;
		existing.Email = request.Email;
		existing.FullName = request.FullName;
		existing.IsActive = request.IsActive;

		try
		{
			IdentityResult result =
				await userManager.UpdateAsync(existing);

			if (!result.Succeeded)
			{
				HandleIdentityErrors(result, request, logger);
			}

			return existing.ToDto();
		}
		catch (DbUpdateException exception)
			when (exception.IsDuplicateKeyViolation())
		{
			HandleDuplicateKeyViolation(exception, request, logger);
			throw; // Unreachable, but satisfies compiler
		}
	}

	/// <summary>
	/// Handles identity errors from update operations.
	/// </summary>
	/// <param name="result">
	/// The result of the identity operation.
	/// </param>
	/// <param name="request">
	/// The update user request.
	/// </param>
	/// <param name="logger">
	/// The logger instance.
	/// </param>
	/// <exception cref="DuplicateUserException">
	/// Thrown when a duplicate username or email is detected.
	/// </exception>
	/// <exception cref="InvalidOperationException">
	/// Thrown when an unknown identity error occurs.
	/// </exception>
	private static void HandleIdentityErrors(
		IdentityResult result,
		UpdateUserRequest request,
		ILogger logger)
	{
		if (result.Errors.Any(error => error.Code == "DuplicateUserName"))
		{
			logger.LogWarning(
				"Duplicate username during update. Username: {Username}, UserId: {UserId}",
				request.Username,
				request.Id);

			throw new DuplicateUserException(
				$"Failed to update user: Username '{request.Username}' is already taken");
		}

		if (result.Errors.Any(error => error.Code == "DuplicateEmail"))
		{
			logger.LogWarning(
				"Duplicate email during update. Email: {Email}, UserId: {UserId}",
				request.Email,
				request.Id);

			throw new DuplicateUserException(
				$"Failed to update user: Email '{request.Email}' is already registered");
		}

		string errors =
			string.Join(", ", result.Errors.Select(error => error.Description));

		throw new InvalidOperationException(errors);
	}

	/// <summary>
	/// Handles duplicate key violations from the database.
	/// </summary>
	/// <param name="exception">
	/// The database update exception.
	/// </param>
	/// <param name="request">
	/// The update user request.
	/// </param>
	/// <param name="logger">
	/// The logger instance.
	/// </param>
	/// <exception cref="DuplicateUserException">
	/// Thrown when a duplicate username or email is detected.
	/// </exception>
	private static void HandleDuplicateKeyViolation(
		DbUpdateException exception,
		UpdateUserRequest request,
		ILogger logger)
	{
		string message =
			exception.InnerException?.Message ?? exception.Message;

		bool isUsernameDuplicate =
			message.Contains("IX_Users_Username", StringComparison.OrdinalIgnoreCase)
			|| message.Contains("UserNameIndex", StringComparison.OrdinalIgnoreCase);

		bool isEmailDuplicate =
			message.Contains("IX_Users_Email", StringComparison.OrdinalIgnoreCase)
			|| message.Contains("EmailIndex", StringComparison.OrdinalIgnoreCase);

		if (isUsernameDuplicate)
		{
			logger.LogWarning(
				"Duplicate username constraint. Username: {Username}, UserId: {UserId}",
				request.Username,
				request.Id);

			throw new DuplicateUserException(
				$"Failed to update user: Username '{request.Username}' is already taken");
		}

		if (isEmailDuplicate)
		{
			logger.LogWarning(
				"Duplicate email constraint. Email: {Email}, UserId: {UserId}",
				request.Email,
				request.Id);

			throw new DuplicateUserException(
				$"Failed to update user: Email '{request.Email}' is already registered");
		}

		logger.LogWarning(
			"Unknown duplicate key violation. Username: {Username}, Email: {Email}",
			request.Username,
			request.Email);

		throw new DuplicateUserException(
			"Failed to update user: Username or email already exists");
	}
}