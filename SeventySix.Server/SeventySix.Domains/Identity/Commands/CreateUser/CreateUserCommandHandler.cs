// <copyright file="CreateUserCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
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
	/// <param name="request">
	/// The create user request.
	/// </param>
	/// <param name="messageBus">
	/// Message bus for querying users.
	/// </param>
	/// <param name="userManager">
	/// Identity <see cref="UserManager{TUser}"/> for user operations.
	/// </param>
	/// <param name="timeProvider">
	/// Time provider for current time values.
	/// </param>
	/// <param name="logger">
	/// Logger instance.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The created user DTO.
	/// </returns>
	/// <remarks>
	/// Wolverine's UseEntityFrameworkCoreTransactions middleware automatically wraps this handler in a transaction.
	/// Database unique constraints on UserName and Email provide atomicity - no manual transaction management needed.
	/// </remarks>
	public static async Task<UserDto> HandleAsync(
		CreateUserRequest request,
		IMessageBus messageBus,
		UserManager<ApplicationUser> userManager,
		TimeProvider timeProvider,
		ILogger logger,
		CancellationToken cancellationToken)
	{
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		// Create user entity
		ApplicationUser newUser =
			new()
			{
				UserName = request.Username,
				Email = request.Email,
				FullName = request.FullName,
				IsActive = request.IsActive,
				CreateDate = now,
				CreatedBy =
					request.CreatedBy ?? string.Empty,
			};

		UserDto createdUser;

		try
		{
			// Create user without password - they'll set it via password reset flow
			IdentityResult result =
				await userManager.CreateAsync(newUser);

			if (!result.Succeeded)
			{
				string errors =
					string.Join(", ", result.Errors.Select(error => error.Description));

				// Check for duplicate errors
				if (result.Errors.Any(error =>
					error.Code is "DuplicateUserName" or "DuplicateEmail"))
				{
					throw new DuplicateUserException(errors);
				}

				throw new InvalidOperationException(errors);
			}

			createdUser = newUser.ToDto();
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
				userManager);

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
		long userId,
		UserManager<ApplicationUser> userManager)
	{
		ApplicationUser? user =
			await userManager.FindByIdAsync(userId.ToString());

		if (user == null)
		{
			return;
		}

		user.NeedsPendingEmail = true;

		await userManager.UpdateAsync(user);
	}
}