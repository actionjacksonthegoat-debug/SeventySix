// <copyright file="CompleteRegistrationCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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
	/// <param name="command">
	/// The complete registration command containing token and client IP.
	/// </param>
	/// <param name="registrationService">
	/// Service that creates users and returns auth results.
	/// </param>
	/// <param name="emailVerificationTokenRepository">
	/// Repository for email verification tokens.
	/// </param>
	/// <param name="timeProvider">
	/// Time provider for expiration checks.
	/// </param>
	/// <param name="logger">
	/// Logger instance.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// An <see cref="AuthResult"/> containing access and refresh tokens on success.
	/// </returns>
	/// <remarks>
	/// Wolverine's UseEntityFrameworkCoreTransactions middleware automatically wraps this handler in a transaction.
	/// Database unique constraints on Username and Email provide atomicity - no manual duplicate checks needed.
	/// </remarks>
	public static async Task<AuthResult> HandleAsync(
		CompleteRegistrationCommand command,
		RegistrationService registrationService,
		IEmailVerificationTokenRepository emailVerificationTokenRepository,
		TimeProvider timeProvider,
		ILogger<CompleteRegistrationCommand> logger,
		CancellationToken cancellationToken)
	{
		string tokenHash =
			CryptoExtensions.ComputeSha256Hash(
				command.Request.Token);

		EmailVerificationToken? verificationToken =
			await emailVerificationTokenRepository.GetByHashAsync(
				tokenHash,
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

		long userRoleId =
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
		catch (DbUpdateException exception)
			when (exception.IsDuplicateKeyViolation())
		{
			return DuplicateKeyViolationHandler.HandleAsAuthResult(
				exception,
				command.Request.Username,
				verificationToken!.Email,
				logger);
		}
	}

	private static async Task<User> CreateUserAndMarkTokenUsedAsync(
		CompleteRegistrationCommand command,
		EmailVerificationToken verificationToken,
		long userRoleId,
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