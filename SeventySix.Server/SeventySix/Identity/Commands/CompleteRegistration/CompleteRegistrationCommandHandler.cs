// <copyright file="CompleteRegistrationCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Identity.Constants;
using SeventySix.Shared.Extensions;

namespace SeventySix.Identity;

/// <summary>
/// Handler for CompleteRegistrationCommand.
/// </summary>
public static class CompleteRegistrationCommandHandler
{
	/// <summary>
	/// Handles the CompleteRegistrationCommand request.
	/// </summary>
	/// <remarks>
	/// Wolverine's UseEntityFrameworkCoreTransactions middleware automatically wraps this handler in a transaction.
	/// Database unique constraints on Username and Email provide atomicity - no manual duplicate checks needed.
	/// </remarks>
	public static async Task<AuthResult> HandleAsync(
		CompleteRegistrationCommand command,
		RegistrationService registrationService,
		IEmailVerificationTokenRepository emailVerificationTokenRepository,
		IValidator<CompleteRegistrationRequest> completeRegistrationValidator,
		TimeProvider timeProvider,
		ILogger<CompleteRegistrationCommand> logger,
		CancellationToken cancellationToken)
	{
		await completeRegistrationValidator.ValidateAndThrowAsync(
			command.Request,
			cancellationToken);

		EmailVerificationToken? verificationToken =
			await emailVerificationTokenRepository.GetByTokenAsync(
				command.Request.Token,
				cancellationToken);

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		AuthResult? tokenError =
			ValidateVerificationToken(
				verificationToken,
				now,
				logger);

		if (tokenError != null)
		{
			return tokenError;
		}

		int userRoleId =
			await registrationService.GetRoleIdByNameAsync(
				RoleConstants.User,
				cancellationToken);

		try
		{
			User user =
				await CreateUserAndMarkTokenUsedAsync(
					command,
					verificationToken!,
					userRoleId,
					registrationService,
					emailVerificationTokenRepository,
					now,
					cancellationToken);

			return await registrationService.GenerateAuthResultAsync(
				user,
				command.ClientIp,
				requiresPasswordChange: false,
				rememberMe: false,
				cancellationToken);
		}
		catch (DbUpdateException exception) when (exception.IsDuplicateKeyViolation())
		{
			return HandleDuplicateKeyViolation(
				exception,
				command.Request.Username,
				verificationToken!.Email,
				logger);
		}
	}

	private static async Task<User> CreateUserAndMarkTokenUsedAsync(
		CompleteRegistrationCommand command,
		EmailVerificationToken verificationToken,
		int userRoleId,
		RegistrationService registrationService,
		IEmailVerificationTokenRepository emailVerificationTokenRepository,
		DateTime now,
		CancellationToken cancellationToken)
	{
		User user =
			await registrationService.CreateUserWithCredentialAsync(
				command.Request.Username,
				verificationToken.Email,
				fullName: null,
				command.Request.Password,
				"Self-Registration",
				userRoleId,
				requiresPasswordChange: false,
				cancellationToken);

		verificationToken.IsUsed = true;
		await emailVerificationTokenRepository.SaveChangesAsync(
			verificationToken,
			cancellationToken);

		return user;
	}

	private static AuthResult HandleDuplicateKeyViolation(
		DbUpdateException exception,
		string username,
		string email,
		ILogger logger)
	{
		string message = exception.InnerException?.Message ?? exception.Message;

		if (message.Contains(
			"IX_Users_Username",
			StringComparison.OrdinalIgnoreCase))
		{
			logger.LogWarning(
				"Registration attempt with existing username: {Username}",
				username);

			return AuthResult.Failed(
				"Username is already taken.",
				AuthErrorCodes.UsernameExists);
		}

		if (message.Contains(
			"IX_Users_Email",
			StringComparison.OrdinalIgnoreCase))
		{
			logger.LogWarning(
				"Registration attempt with already registered email: {Email}",
				email);

			return AuthResult.Failed(
				"This email is already registered.",
				AuthErrorCodes.EmailExists);
		}

		// Unknown constraint violation
		return AuthResult.Failed(
			"Username or email already exists.",
			AuthErrorCodes.UsernameExists);
	}

	private static AuthResult? ValidateVerificationToken(
		EmailVerificationToken? token,
		DateTime now,
		ILogger logger)
	{
		if (token == null)
		{
			logger.LogWarning("Invalid email verification token attempted.");

			return AuthResult.Failed(
				"Invalid or expired verification link.",
				AuthErrorCodes.InvalidToken);
		}

		if (token.IsUsed)
		{
			logger.LogWarning(
				"Attempted to use already-used verification token. Email: {Email}",
				token.Email);

			return AuthResult.Failed(
				"This verification link has already been used.",
				AuthErrorCodes.TokenExpired);
		}

		if (token.ExpiresAt < now)
		{
			logger.LogWarning(
				"Attempted to use expired verification token. Email: {Email}, ExpiredAt: {ExpiredAt}",
				token.Email,
				token.ExpiresAt);

			return AuthResult.Failed(
				"This verification link has expired. Please request a new one.",
				AuthErrorCodes.TokenExpired);
		}

		return null;
	}
}