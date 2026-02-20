// <copyright file="UpdateUserCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SeventySix.Shared.Extensions;
using SeventySix.Shared.Interfaces;

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
	/// <param name="userManager">
	/// Identity UserManager for user operations.
	/// </param>
	/// <param name="identityCache">
	/// Identity cache service for clearing user cache.
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
	/// Uses <see cref="ITransactionManager"/> to wrap the fetch and update in a transaction with automatic
	/// retry on concurrency conflicts. ASP.NET Identity uses a ConcurrencyStamp for optimistic concurrency;
	/// concurrent updates to the same user produce a <c>ConcurrencyFailure</c> result which is translated
	/// to <see cref="DbUpdateConcurrencyException"/> so the TransactionManager can retry with a fresh fetch.
	/// </remarks>
	public static async Task<UserDto> HandleAsync(
		UpdateUserRequest request,
		UserManager<ApplicationUser> userManager,
		IIdentityCacheService identityCache,
		ITransactionManager transactionManager,
		ILogger<UpdateUserRequest> logger,
		CancellationToken cancellationToken)
	{
		string previousEmail = string.Empty;
		string previousUsername = string.Empty;
		UserDto? updatedUser = null;

		await transactionManager.ExecuteInTransactionAsync(
			async ct =>
			{
				ApplicationUser? existing =
					await userManager.FindByIdAsync(
						request.Id.ToString());

				if (existing == null)
				{
					throw new UserNotFoundException(request.Id);
				}

				// Capture previous values for cache invalidation after transaction
				previousEmail =
					existing.Email ?? string.Empty;
				previousUsername =
					existing.UserName ?? string.Empty;

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

					updatedUser = existing.ToDto();
				}
				catch (DbUpdateException exception)
					when (exception.IsDuplicateKeyViolation())
				{
					HandleDuplicateKeyViolation(exception, request, logger);
					throw; // Unreachable, but satisfies compiler
				}
			},
			cancellationToken: cancellationToken);

		// Invalidate cache for old values
		await identityCache.InvalidateUserAsync(
			request.Id,
			email: previousEmail,
			username: previousUsername);

		// Invalidate cache for new values if changed
		bool emailChanged =
			!string.Equals(
				previousEmail,
				request.Email,
				StringComparison.OrdinalIgnoreCase);

		bool usernameChanged =
			!string.Equals(
				previousUsername,
				request.Username,
				StringComparison.OrdinalIgnoreCase);

		if (emailChanged || usernameChanged)
		{
			await identityCache.InvalidateUserAsync(
				request.Id,
				email: emailChanged ? request.Email : null,
				username: usernameChanged ? request.Username : null);
		}

		// Invalidate all users list for admin views
		await identityCache.InvalidateAllUsersAsync();

		return updatedUser!;
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
		ILogger<UpdateUserRequest> logger)
	{
		if (result.Errors.Any(error => error.Code == "ConcurrencyFailure"))
		{
			logger.LogWarning(
				"Concurrency conflict during update. UserId: {UserId}",
				request.Id);

			// Propagate as DbUpdateConcurrencyException so ITransactionManager retries
			// with a fresh entity fetch and exponential backoff.
			throw new DbUpdateConcurrencyException(
				$"Concurrency conflict updating user {request.Id}");
		}

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
			string.Join(
				", ",
				result.Errors.Select(error => error.Description));

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
		ILogger<UpdateUserRequest> logger)
	{
		string message =
			exception.InnerException?.Message ?? exception.Message;

		bool isUsernameDuplicate =
			message.Contains(
				"IX_Users_Username",
				StringComparison.OrdinalIgnoreCase)
				|| message.Contains(
					"UserNameIndex",
					StringComparison.OrdinalIgnoreCase);

		bool isEmailDuplicate =
			message.Contains(
				"IX_Users_Email",
				StringComparison.OrdinalIgnoreCase)
				|| message.Contains(
					"EmailIndex",
					StringComparison.OrdinalIgnoreCase);

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