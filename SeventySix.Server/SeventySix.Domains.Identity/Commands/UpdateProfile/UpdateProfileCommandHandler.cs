// <copyright file="UpdateProfileCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SeventySix.Shared.Extensions;
using Wolverine;

namespace SeventySix.Identity;

/// <summary>
/// Handler for <see cref="UpdateProfileCommand"/>.
/// </summary>
public static class UpdateProfileCommandHandler
{
	/// <summary>
	/// Handles user profile update with duplicate email check.
	/// </summary>
	/// <param name="command">
	/// The update profile command.
	/// </param>
	/// <param name="messageBus">
	/// Message bus for querying updated profile.
	/// </param>
	/// <param name="userManager">
	/// Identity <see cref="UserManager{TUser}"/> for user operations.
	/// </param>
	/// <param name="identityCache">
	/// Identity cache service for clearing user cache.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The updated user profile or null if user not found.
	/// </returns>
	/// <remarks>
	/// Wolverine's UseEntityFrameworkCoreTransactions middleware automatically wraps this handler in a transaction.
	/// Database unique constraint on Email provides atomicity - no manual transaction management needed.
	/// </remarks>
	public static async Task<UserProfileDto?> HandleAsync(
		UpdateProfileCommand command,
		IMessageBus messageBus,
		UserManager<ApplicationUser> userManager,
		IIdentityCacheService identityCache,
		CancellationToken cancellationToken)
	{
		ApplicationUser? user =
			await userManager.FindByIdAsync(
				command.UserId.ToString());

		if (user == null)
		{
			return null;
		}

		// Capture previous email for cache invalidation
		string? previousEmail =
			user.Email;

		user.Email = command.Request.Email;
		user.FullName = command.Request.FullName;

		try
		{
			IdentityResult result =
				await userManager.UpdateAsync(user);

			if (!result.Succeeded)
			{
				if (result.Errors.Any(error =>
					error.Code == "DuplicateEmail"))
				{
					throw new DuplicateUserException(
						$"Email '{command.Request.Email}' is already registered");
				}

				throw new InvalidOperationException(
					string.Join(
						", ",
						result.Errors.Select(error => error.Description)));
			}

			// Invalidate cache for old email
			await identityCache.InvalidateUserAsync(
				command.UserId,
				email: previousEmail);

			// Invalidate cache for new email if changed
			bool emailChanged =
				!string.Equals(
					previousEmail,
					command.Request.Email,
					StringComparison.OrdinalIgnoreCase);

			if (emailChanged)
			{
				await identityCache.InvalidateUserAsync(
					command.UserId,
					email: command.Request.Email);
			}

			// Query full profile after successful update
			return await messageBus.InvokeAsync<UserProfileDto?>(
				new GetUserProfileQuery(command.UserId),
				cancellationToken);
		}
		catch (DbUpdateException exception)
			when (exception.IsDuplicateKeyViolation())
		{
			// Database unique constraint violation on email
			throw new DuplicateUserException(
				$"Email '{command.Request.Email}' is already registered");
		}
	}
}