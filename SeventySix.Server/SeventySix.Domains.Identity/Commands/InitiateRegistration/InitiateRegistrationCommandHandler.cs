// <copyright file="InitiateRegistrationCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Contracts.Emails;
using Wolverine;

namespace SeventySix.Identity;

/// <summary>
/// Handler for initiating user registration.
/// </summary>
/// <remarks>
/// Uses ASP.NET Core Identity's token providers for email verification.
/// Creates a temporary unconfirmed user and enqueues verification email via the email queue.
/// Follows the same queue-based pattern as password reset for consistency.
/// Includes ALTCHA Proof-of-Work validation when enabled.
/// </remarks>
public static class InitiateRegistrationCommandHandler
{
	/// <summary>
	/// Handles the registration initiation request.
	/// </summary>
	/// <param name="request">
	/// The initiate registration request.
	/// </param>
	/// <param name="altchaService">
	/// Service for ALTCHA Proof-of-Work validation.
	/// </param>
	/// <param name="userManager">
	/// Identity <see cref="UserManager{TUser}"/> for user operations.
	/// </param>
	/// <param name="messageBus">
	/// Message bus for enqueuing emails.
	/// </param>
	/// <param name="timeProvider">
	/// Time provider.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	/// <remarks>
	/// Always succeeds to prevent email enumeration.
	/// If email exists, silently returns without action.
	/// </remarks>
	public static async Task HandleAsync(
		InitiateRegistrationRequest request,
		IAltchaService altchaService,
		UserManager<ApplicationUser> userManager,
		IMessageBus messageBus,
		TimeProvider timeProvider,
		CancellationToken cancellationToken)
	{
		// Validate ALTCHA if enabled
		// Silent failure to prevent enumeration attacks
		if (altchaService.IsEnabled)
		{
			AltchaValidationResult altchaResult =
				await altchaService.ValidateAsync(
					request.AltchaPayload ?? string.Empty,
					cancellationToken);

			if (!altchaResult.Success)
			{
				return;
			}
		}

		string email =
			request.Email;

		// Check if email is already registered
		ApplicationUser? existingUser =
			await userManager.FindByEmailAsync(
				email);

		if (existingUser is not null)
		{
			return; // Silent success to prevent enumeration
		}

		DateTimeOffset now =
			timeProvider.GetUtcNow();

		// Create temporary user with unconfirmed email
		// User will complete registration with password after clicking link
		ApplicationUser temporaryUser =
			new()
			{
				UserName = email, // Temporary username, will be set properly in CompleteRegistration
				Email = email,
				IsActive = false, // Inactive until registration completes
				EmailConfirmed = false,
				LockoutEnabled = true,
				CreateDate = now,
				CreatedBy =
					AuditConstants.SystemUser,
			};

		IdentityResult createResult =
			await userManager.CreateAsync(
				temporaryUser);

		if (!createResult.Succeeded)
		{
			// Could be a race condition or validation error - silently return
			return;
		}

		// Generate email confirmation token using Identity's built-in token provider
		string verificationToken =
			await userManager.GenerateEmailConfirmationTokenAsync(
				temporaryUser);

		// Enqueue verification email for async delivery (consistent with password reset pattern)
		Dictionary<string, string> templateData =
			new()
			{
				["verificationToken"] = verificationToken
			};

		await messageBus.InvokeAsync(
			new EnqueueEmailCommand(
				EmailTypeConstants.Verification,
				email,
				temporaryUser.Id,
				templateData),
			cancellationToken);
	}
}