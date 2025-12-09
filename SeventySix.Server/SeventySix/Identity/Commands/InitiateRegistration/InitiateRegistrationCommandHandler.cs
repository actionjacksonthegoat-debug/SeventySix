// <copyright file="InitiateRegistrationCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Security.Cryptography;
using FluentValidation;
using SeventySix.ElectronicNotifications.Emails;

namespace SeventySix.Identity;

/// <summary>
/// Handler for InitiateRegistrationCommand.
/// </summary>
public static class InitiateRegistrationCommandHandler
{
	/// <summary>
	/// Handles the InitiateRegistrationCommand request.
	/// </summary>
	/// <remarks>
	/// Always succeeds to prevent email enumeration.
	/// </remarks>
	public static async Task HandleAsync(
		InitiateRegistrationCommand command,
		IUserValidationRepository userValidationRepository,
		IEmailVerificationTokenRepository emailVerificationTokenRepository,
		IValidator<InitiateRegistrationRequest> initiateRegistrationValidator,
		IEmailService emailService,
		TimeProvider timeProvider,
		CancellationToken cancellationToken)
	{
		await initiateRegistrationValidator.ValidateAndThrowAsync(
			command.Request,
			cancellationToken);

		string email =
			command.Request.Email;

		// Check if email is already registered
		bool emailExists =
			await userValidationRepository.EmailExistsAsync(
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