// <copyright file="LoginCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Identity.Constants;
using SeventySix.Shared.Exceptions;

namespace SeventySix.Identity;

/// <summary>
/// Handler for login command.
/// </summary>
public static class LoginCommandHandler
{
	/// <summary>
	/// Handles login command.
	/// </summary>
	/// <param name="command">
	/// The login command containing credentials and options.
	/// </param>
	/// <param name="authRepository">
	/// Repository for user authentication queries.
	/// </param>
	/// <param name="credentialRepository">
	/// Repository for user credentials.
	/// </param>
	/// <param name="passwordHasher">
	/// Service for password verification.
	/// </param>
	/// <param name="authenticationService">
	/// Service to generate auth tokens on success.
	/// </param>
	/// <param name="authSettings">
	/// Authentication-related configuration settings.
	/// </param>
	/// <param name="timeProvider">
	/// Time provider used for lockout and expiration checks.
	/// </param>
	/// <param name="logger">
	/// Logger instance.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// An <see cref="AuthResult"/> indicating authentication result.
	/// </returns>
	public static async Task<AuthResult> HandleAsync(
		LoginCommand command,
		IAuthRepository authRepository,
		ICredentialRepository credentialRepository,
		IPasswordHasher passwordHasher,
		AuthenticationService authenticationService,
		IOptions<AuthSettings> authSettings,
		TimeProvider timeProvider,
		ILogger<LoginCommand> logger,
		CancellationToken cancellationToken)
	{
		User? user =
			await authRepository.GetUserByUsernameOrEmailForUpdateAsync(
				command.Request.UsernameOrEmail,
				cancellationToken);

		AuthResult? userError =
			ValidateUserCanLogin(
				user,
				command.Request.UsernameOrEmail,
				authSettings,
				timeProvider,
				logger);
		if (userError != null)
		{
			return userError;
		}

		UserCredential? credential =
			await credentialRepository.GetByUserIdAsync(
				user!.Id,
				cancellationToken);

		AuthResult? credentialError =
			await ValidateCredentialAsync(
				user,
				credential,
				command.Request.Password,
				passwordHasher,
				authRepository,
				authSettings,
				timeProvider,
				logger,
				cancellationToken);
		if (credentialError != null)
		{
			return credentialError;
		}

		await ResetLockoutAsync(user, authRepository, cancellationToken);

		bool requiresPasswordChange =
			credential!.PasswordChangedAt == null;
		return await authenticationService.GenerateAuthResultAsync(
			user,
			command.ClientIp,
			requiresPasswordChange,
			command.Request.RememberMe,
			cancellationToken);
	}

	private static bool IsAccountLockedOut(
		User user,
		IOptions<AuthSettings> authSettings,
		TimeProvider timeProvider)
	{
		if (!authSettings.Value.Lockout.Enabled)
		{
			return false;
		}

		if (user.LockoutEndUtc == null)
		{
			return false;
		}

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		if (user.LockoutEndUtc <= now)
		{
			return false;
		}

		return true;
	}

	private static AuthResult? ValidateUserCanLogin(
		User? user,
		string usernameOrEmail,
		IOptions<AuthSettings> authSettings,
		TimeProvider timeProvider,
		ILogger<LoginCommand> logger)
	{
		if (user == null)
		{
			logger.LogWarning(
				"Login attempt with invalid credentials. UsernameOrEmail: {UsernameOrEmail}",
				usernameOrEmail);
			return AuthResult.Failed(
				"Invalid username/email or password.",
				AuthErrorCodes.InvalidCredentials);
		}

		if (IsAccountLockedOut(user, authSettings, timeProvider))
		{
			logger.LogWarning(
				"Login attempt for locked account. UserId: {UserId}, LockoutEnd: {LockoutEnd}",
				user.Id,
				user.LockoutEndUtc);
			return AuthResult.Failed(
				"Account is temporarily locked. Please try again later.",
				AuthErrorCodes.AccountLocked);
		}

		if (!user.IsActive)
		{
			logger.LogWarning(
				"Login attempt for inactive account. UserId: {UserId}",
				user.Id);
			return AuthResult.Failed(
				"Account is inactive.",
				AuthErrorCodes.AccountInactive);
		}

		return null;
	}

	private static async Task<AuthResult?> ValidateCredentialAsync(
		User user,
		UserCredential? credential,
		string password,
		IPasswordHasher passwordHasher,
		IAuthRepository authRepository,
		IOptions<AuthSettings> authSettings,
		TimeProvider timeProvider,
		ILogger<LoginCommand> logger,
		CancellationToken cancellationToken)
	{
		if (credential == null)
		{
			logger.LogWarning(
				"Login attempt for user without password. UserId: {UserId}",
				user.Id);
			return AuthResult.Failed(
				"Invalid username/email or password.",
				AuthErrorCodes.InvalidCredentials);
		}

		if (!passwordHasher.VerifyPassword(password, credential.PasswordHash))
		{
			await HandleFailedLoginAttemptAsync(
				user,
				authRepository,
				authSettings,
				timeProvider,
				logger,
				cancellationToken);
			logger.LogWarning(
				"Login attempt with wrong password. UserId: {UserId}, FailedAttempts: {FailedAttempts}",
				user.Id,
				user.FailedLoginCount);
			return AuthResult.Failed(
				"Invalid username/email or password.",
				AuthErrorCodes.InvalidCredentials);
		}

		return null;
	}

	private static async Task HandleFailedLoginAttemptAsync(
		User user,
		IAuthRepository authRepository,
		IOptions<AuthSettings> authSettings,
		TimeProvider timeProvider,
		ILogger<LoginCommand> logger,
		CancellationToken cancellationToken)
	{
		if (!authSettings.Value.Lockout.Enabled)
		{
			return;
		}

		user.FailedLoginCount++;

		if (
			user.FailedLoginCount
			>= authSettings.Value.Lockout.MaxFailedAttempts)
		{
			DateTime lockoutEnd =
				timeProvider
				.GetUtcNow()
				.AddMinutes(authSettings.Value.Lockout.LockoutDurationMinutes)
				.UtcDateTime;

			user.LockoutEndUtc = lockoutEnd;

			logger.LogWarning(
				"Account locked due to failed attempts. UserId: {UserId}, FailedAttempts: {FailedAttempts}, LockoutEnd: {LockoutEnd}",
				user.Id,
				user.FailedLoginCount,
				lockoutEnd);
		}

		await authRepository.SaveUserChangesAsync(user, cancellationToken);
	}

	private static async Task ResetLockoutAsync(
		User user,
		IAuthRepository authRepository,
		CancellationToken cancellationToken)
	{
		if (user.FailedLoginCount == 0 && user.LockoutEndUtc == null)
		{
			return;
		}

		user.FailedLoginCount = 0;
		user.LockoutEndUtc = null;

		await authRepository.SaveUserChangesAsync(user, cancellationToken);
	}
}