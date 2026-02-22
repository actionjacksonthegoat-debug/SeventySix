// <copyright file="UpdateProfileCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SeventySix.Shared.Extensions;
using SeventySix.Shared.Interfaces;
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
	/// <param name="transactionManager">
	/// Transaction manager for concurrency-safe read-then-write operations.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The updated user profile or null if user not found.
	/// </returns>
	public static async Task<UserProfileDto?> HandleAsync(
		UpdateProfileCommand command,
		IMessageBus messageBus,
		UserManager<ApplicationUser> userManager,
		IIdentityCacheService identityCache,
		ITransactionManager transactionManager,
		CancellationToken cancellationToken)
	{
		string? previousEmail = null;

		await transactionManager.ExecuteInTransactionAsync(
			async ct =>
			{
				ApplicationUser? user =
					await userManager.FindByIdAsync(
						command.UserId.ToString());

				if (user is null)
				{
					return;
				}

				previousEmail = user.Email;
				user.Email = command.Request.Email;
				user.FullName = command.Request.FullName;

				try
				{
					IdentityResult result =
						await userManager.UpdateAsync(user);

					if (!result.Succeeded)
					{
						HandleIdentityErrors(result, command.Request.Email);
					}
				}
				catch (DbUpdateException exception)
					when (exception.IsDuplicateKeyViolation())
				{
					throw new DuplicateUserException(
						$"Email '{command.Request.Email}' is already registered");
				}
			},
			cancellationToken: cancellationToken);

		if (previousEmail is null)
		{
			return null;
		}

		// Invalidate cache for old email (outside transaction — after commit)
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

		// Query full profile after successful update (outside transaction)
		return await messageBus.InvokeAsync<UserProfileDto?>(
			new GetUserProfileQuery(command.UserId),
			cancellationToken);
	}

	private static void HandleIdentityErrors(IdentityResult result, string email)
	{
		if (result.Errors.Any(error => error.Code == "DuplicateEmail"))
		{
			throw new DuplicateUserException(
				$"Email '{email}' is already registered");
		}

		if (result.Errors.Any(error => error.Code == "ConcurrencyFailure"))
		{
			throw new DbUpdateConcurrencyException(
				"Concurrency conflict updating user profile. Will retry.");
		}

		throw new InvalidOperationException(
			string.Join(
				", ",
				result.Errors.Select(error => error.Description)));
	}
}