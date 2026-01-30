// <copyright file="CreateUserCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SeventySix.Shared.Contracts.Emails;
using SeventySix.Shared.Extensions;
using SeventySix.Shared.Interfaces;
using Wolverine;

namespace SeventySix.Identity;

/// <summary>
/// Handler for <see cref="CreateUserRequest"/>.
/// </summary>
public static class CreateUserCommandHandler
{
	/// <summary>
	/// Handles user creation with duplicate checks and enqueues welcome email.
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
	/// <param name="cacheInvalidation">
	/// Cache invalidation service for clearing user cache.
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
	/// Welcome emails are enqueued for async delivery via the email queue.
	/// </remarks>
	public static async Task<UserDto> HandleAsync(
		CreateUserRequest request,
		IMessageBus messageBus,
		UserManager<ApplicationUser> userManager,
		ICacheInvalidationService cacheInvalidation,
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
				EmailConfirmed = true,
				LockoutEnabled = true,
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
					string.Join(
						", ",
						result.Errors.Select(error => error.Description));

				// Check for duplicate errors
				if (result.Errors.Any(
					error =>
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

		// Generate password reset token and enqueue welcome email
		try
		{
			string resetToken =
				await userManager.GeneratePasswordResetTokenAsync(newUser);

			// Format: {userId}:{resetToken}
			string combinedToken =
				$"{newUser.Id}:{resetToken}";

			await messageBus.InvokeAsync(
				new EnqueueEmailCommand(
					EmailTypeConstants.Welcome,
					createdUser.Email,
					createdUser.Id,
					new Dictionary<string, string>
					{
						["username"] = createdUser.Username,
						["resetToken"] = combinedToken
					}),
				cancellationToken);
		}
		catch (Exception ex)
		{
			// Log but don't fail - user was created, email can be resent manually
			logger.LogWarning(
				ex,
				"Failed to enqueue welcome email for user {Email} (ID: {UserId}). User was created successfully.",
				createdUser.Email,
				createdUser.Id);
		}

		// Invalidate all users list cache since a new user was created
		await cacheInvalidation.InvalidateAllUsersCacheAsync();

		return createdUser;
	}
}