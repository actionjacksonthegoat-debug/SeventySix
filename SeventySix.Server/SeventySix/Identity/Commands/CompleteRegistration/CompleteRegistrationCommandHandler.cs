// <copyright file="CompleteRegistrationCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Identity.Constants;
using SeventySix.Shared;

namespace SeventySix.Identity;

/// <summary>
/// Handler for CompleteRegistrationCommand.
/// </summary>
public static class CompleteRegistrationCommandHandler
{
	/// <summary>
	/// Handles the CompleteRegistrationCommand request.
	/// </summary>
	public static async Task<AuthResult> HandleAsync(
		CompleteRegistrationCommand command,
		IUserValidationRepository userValidationRepository,
		IAuthRepository authRepository,
		ICredentialRepository credentialRepository,
		IEmailVerificationTokenRepository emailVerificationTokenRepository,
		IUserRoleRepository userRoleRepository,
		ITokenService tokenService,
		IOptions<AuthSettings> authSettings,
		IOptions<JwtSettings> jwtSettings,
		IValidator<CompleteRegistrationRequest> completeRegistrationValidator,
		TimeProvider timeProvider,
		ITransactionManager transactionManager,
		ILogger<CompleteRegistrationCommand> logger,
		CancellationToken cancellationToken)
	{
		await completeRegistrationValidator.ValidateAndThrowAsync(
			command.Request,
			cancellationToken);

		// Find the verification token
		EmailVerificationToken? verificationToken =
			await emailVerificationTokenRepository.GetByTokenAsync(
				command.Request.Token,
				cancellationToken);

		if (verificationToken == null)
		{
			logger.LogWarning("Invalid email verification token attempted.");
			return AuthResult.Failed(
				"Invalid or expired verification link.",
				AuthErrorCodes.InvalidToken);
		}

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		if (verificationToken.IsUsed)
		{
			logger.LogWarning(
				"Attempted to use already-used verification token. Email: {Email}",
				verificationToken.Email);
			return AuthResult.Failed(
				"This verification link has already been used.",
				AuthErrorCodes.TokenExpired);
		}

		if (verificationToken.ExpiresAt < now)
		{
			logger.LogWarning(
				"Attempted to use expired verification token. Email: {Email}, ExpiredAt: {ExpiredAt}",
				verificationToken.Email,
				verificationToken.ExpiresAt);
			return AuthResult.Failed(
				"This verification link has expired. Please request a new one.",
				AuthErrorCodes.TokenExpired);
		}

		// Check if username already exists
		bool usernameExists =
			await userValidationRepository.UsernameExistsAsync(
				command.Request.Username,
				excludeId: null,
				cancellationToken);

		if (usernameExists)
		{
			logger.LogWarning(
				"Registration attempt with existing username: {Username}",
				command.Request.Username);
			return AuthResult.Failed(
				"Username is already taken.",
				AuthErrorCodes.UsernameExists);
		}

		// Double-check email isn't already registered (race condition protection)
		bool emailExists =
			await userValidationRepository.EmailExistsAsync(
				verificationToken.Email,
				excludeId: null,
				cancellationToken);

		if (emailExists)
		{
			logger.LogWarning(
				"Registration attempt with already registered email: {Email}",
				verificationToken.Email);
			return AuthResult.Failed(
				"This email is already registered.",
				AuthErrorCodes.EmailExists);
		}

		// Get role ID before creating entities (read-only query)
		int userRoleId =
			await RegistrationHelpers.GetRoleIdByNameAsync(
				authRepository,
				RoleConstants.User,
				logger,
				cancellationToken);

		// Create user with credential and role atomically
		User user =
			await transactionManager.ExecuteInTransactionAsync(
				async transactionCancellationToken =>
				{
					User createdUser =
						await RegistrationHelpers.CreateUserWithCredentialAsync(
							authRepository,
							credentialRepository,
							command.Request.Username,
							verificationToken.Email,
							fullName: null,
							command.Request.Password,
							"Self-Registration",
							userRoleId,
							requiresPasswordChange: false,
							authSettings,
							now,
							transactionCancellationToken);

					// Mark token as used
					verificationToken.IsUsed = true;
					await emailVerificationTokenRepository.SaveChangesAsync(
						verificationToken,
						transactionCancellationToken);

					return createdUser;
				},
				cancellationToken: cancellationToken);

		return await RegistrationHelpers.GenerateAuthResultAsync(
			user,
			command.ClientIp,
			requiresPasswordChange: false,
			rememberMe: false,
			userRoleRepository,
			tokenService,
			jwtSettings,
			timeProvider,
			cancellationToken);
	}
}
