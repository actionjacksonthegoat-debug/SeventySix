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
		await completeRegistrationValidator.ValidateAndThrowAsync(command.Request, cancellationToken);

		EmailVerificationToken? verificationToken = await emailVerificationTokenRepository.GetByTokenAsync(command.Request.Token, cancellationToken);
		DateTime now = timeProvider.GetUtcNow().UtcDateTime;

		AuthResult? tokenError = ValidateVerificationToken(verificationToken, now, logger);
		if (tokenError != null)
		{
			return tokenError;
		}

		AuthResult? userError = await ValidateUserDoesNotExistAsync(userValidationRepository, command.Request.Username, verificationToken!.Email, logger, cancellationToken);
		if (userError != null)
		{
			return userError;
		}

		int userRoleId = await RegistrationHelpers.GetRoleIdByNameAsync(authRepository, RoleConstants.User, logger, cancellationToken);

		User user = await CreateUserInTransactionAsync(
			command, verificationToken!, userRoleId, authRepository, credentialRepository,
			emailVerificationTokenRepository, authSettings, now, transactionManager, cancellationToken);

		return await RegistrationHelpers.GenerateAuthResultAsync(
			user, command.ClientIp, requiresPasswordChange: false, rememberMe: false,
			userRoleRepository, tokenService, jwtSettings, timeProvider, cancellationToken);
	}

	private static AuthResult? ValidateVerificationToken(EmailVerificationToken? token, DateTime now, ILogger logger)
	{
		if (token == null)
		{
			logger.LogWarning("Invalid email verification token attempted.");
			return AuthResult.Failed("Invalid or expired verification link.", AuthErrorCodes.InvalidToken);
		}

		if (token.IsUsed)
		{
			logger.LogWarning("Attempted to use already-used verification token. Email: {Email}", token.Email);
			return AuthResult.Failed("This verification link has already been used.", AuthErrorCodes.TokenExpired);
		}

		if (token.ExpiresAt < now)
		{
			logger.LogWarning("Attempted to use expired verification token. Email: {Email}, ExpiredAt: {ExpiredAt}", token.Email, token.ExpiresAt);
			return AuthResult.Failed("This verification link has expired. Please request a new one.", AuthErrorCodes.TokenExpired);
		}

		return null;
	}

	private static async Task<AuthResult?> ValidateUserDoesNotExistAsync(
		IUserValidationRepository repository,
		string username,
		string email,
		ILogger logger,
		CancellationToken cancellationToken)
	{
		if (await repository.UsernameExistsAsync(username, excludeId: null, cancellationToken))
		{
			logger.LogWarning("Registration attempt with existing username: {Username}", username);
			return AuthResult.Failed("Username is already taken.", AuthErrorCodes.UsernameExists);
		}

		if (await repository.EmailExistsAsync(email, excludeId: null, cancellationToken))
		{
			logger.LogWarning("Registration attempt with already registered email: {Email}", email);
			return AuthResult.Failed("This email is already registered.", AuthErrorCodes.EmailExists);
		}

		return null;
	}

	private static async Task<User> CreateUserInTransactionAsync(
		CompleteRegistrationCommand command,
		EmailVerificationToken token,
		int roleId,
		IAuthRepository authRepository,
		ICredentialRepository credentialRepository,
		IEmailVerificationTokenRepository emailVerificationTokenRepository,
		IOptions<AuthSettings> authSettings,
		DateTime now,
		ITransactionManager transactionManager,
		CancellationToken cancellationToken)
	{
		return await transactionManager.ExecuteInTransactionAsync(async transactionCancellationToken =>
		{
			User user = await RegistrationHelpers.CreateUserWithCredentialAsync(
				authRepository,
				credentialRepository,
				command.Request.Username,
				token.Email,
				fullName: null,
				command.Request.Password,
				"Self-Registration",
				roleId,
				requiresPasswordChange: false,
				authSettings,
				now,
				transactionCancellationToken);

			token.IsUsed = true;
			await emailVerificationTokenRepository.SaveChangesAsync(token, transactionCancellationToken);
			return user;
		}, cancellationToken: cancellationToken);
	}
}