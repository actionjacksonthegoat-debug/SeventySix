// <copyright file="InitiateRegistrationCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Security.Cryptography;
using SeventySix.ElectronicNotifications.Emails;

namespace SeventySix.Identity;

/// <summary>
/// Handler for initiating user registration.
/// </summary>
public static class InitiateRegistrationCommandHandler
{
	/// <summary>
	/// Handles the registration initiation request.
	/// </summary>
	/// <param name="request">The initiate registration request.</param>
	/// <param name="userQueryRepository">User query repository.</param>
	/// <param name="emailVerificationTokenRepository">Email verification token repository.</param>
	/// <param name="emailService">Email service.</param>
	/// <param name="timeProvider">Time provider.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>A task representing the async operation.</returns>
	/// <remarks>
	/// Always succeeds to prevent email enumeration.
	/// </remarks>
	public static async Task HandleAsync(
		InitiateRegistrationRequest request,
		IUserQueryRepository repository,
		IEmailVerificationTokenRepository emailVerificationTokenRepository,
		IEmailService emailService,
		TimeProvider timeProvider,
		CancellationToken cancellationToken)
	{
		string email =
			request.Email;

		// Check if email is already registered
		bool emailExists =
			await repository.EmailExistsAsync(
				email,
				excludeId: null,
				cancellationToken);

		if (emailExists)
		{
			return; // Silent success to prevent enumeration
		}

		// Invalidate any existing verification tokens for this email
		await emailVerificationTokenRepository.InvalidateTokensForEmailAsync(
			email,
			cancellationToken);

		// Generate new verification token
		byte[] tokenBytes =
			RandomNumberGenerator.GetBytes(64);
		string token =
			Convert.ToBase64String(tokenBytes);

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		EmailVerificationToken verificationToken =
			new()
			{
				Email = email,
				Token = token,
				ExpiresAt = now.AddHours(24),
				CreateDate = now,
				IsUsed = false,
			};

		await emailVerificationTokenRepository.CreateAsync(
			verificationToken,
			cancellationToken);

		// Send verification email
		await emailService.SendVerificationEmailAsync(
			email,
			token,
			cancellationToken);
	}
}