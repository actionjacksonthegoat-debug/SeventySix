// <copyright file="SetPasswordCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Shared.Extensions;
using Wolverine;

namespace SeventySix.Identity;

/// <summary>
/// Handler for setting password using a reset token.
/// </summary>
public static class SetPasswordCommandHandler
{
	/// <summary>
	/// Handles the set password command.
	/// </summary>
	/// <param name="command">
	/// The set password command containing token and new password.
	/// </param>
	/// <param name="passwordResetTokenRepository">
	/// Repository for password reset tokens.
	/// </param>
	/// <param name="credentialRepository">
	/// Repository managing user credentials.
	/// </param>
	/// <param name="messageBus">
	/// Message bus for invoking queries/commands.
	/// </param>
	/// <param name="tokenRepository">
	/// Repository for refresh tokens.
	/// </param>
	/// <param name="passwordHasher">
	/// Service to hash and verify passwords.
	/// </param>
	/// <param name="registrationService">
	/// Service to generate authentication results.
	/// </param>
	/// <param name="timeProvider">
	/// Time provider for current time values.
	/// </param>
	/// <param name="logger">
	/// Logger instance for audit and errors.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// An <see cref="AuthResult"/> indicating success or failure.
	/// </returns>
	/// <exception cref="ArgumentException">Thrown when validation fails.</exception>
	/// <exception cref="InvalidOperationException">Thrown when user not found or inactive.</exception>
	public static async Task<AuthResult> HandleAsync(
		SetPasswordCommand command,
		IPasswordResetTokenRepository passwordResetTokenRepository,
		ICredentialRepository credentialRepository,
		IMessageBus messageBus,
		ITokenRepository tokenRepository,
		IPasswordHasher passwordHasher,
		RegistrationService registrationService,
		TimeProvider timeProvider,
		ILogger<SetPasswordCommand> logger,
		CancellationToken cancellationToken)
	{
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		string tokenHash =
			CryptoExtensions.ComputeSha256Hash(
				command.Request.Token);

		PasswordResetToken? resetToken =
			await passwordResetTokenRepository.GetByHashAsync(
				tokenHash,
				cancellationToken);
		ValidateResetToken(resetToken, now, logger);

		UserDto user =
			await GetActiveUserAsync(
				messageBus,
				resetToken!.UserId,
				logger,
				cancellationToken);
		await passwordResetTokenRepository.MarkAsUsedAsync(
			resetToken,
			cancellationToken);

		await UpdateCredentialAsync(
			credentialRepository,
			passwordHasher,
			user.Id,
			command.Request.NewPassword,
			now,
			cancellationToken);
		await tokenRepository.RevokeAllUserTokensAsync(
			user.Id,
			now,
			cancellationToken);

		return await registrationService.GenerateAuthResultAsync(
			user.ToEntity(),
			command.ClientIp,
			requiresPasswordChange: false,
			rememberMe: false,
			cancellationToken);
	}

	private static void ValidateResetToken(
		PasswordResetToken? token,
		DateTime now,
		ILogger logger)
	{
		if (token is null)
		{
			logger.LogWarning("Password reset token not found");
			throw new ArgumentException(
				"Invalid or expired password reset token",
				"Token");
		}

		if (token.IsUsed)
		{
			logger.LogWarning(
				"Password reset token already used for user {UserId}",
				token.UserId);
			throw new ArgumentException(
				"Invalid or expired password reset token",
				"Token");
		}

		if (token.ExpiresAt < now)
		{
			logger.LogWarning(
				"Password reset token expired for user {UserId}",
				token.UserId);
			throw new ArgumentException(
				"Invalid or expired password reset token",
				"Token");
		}
	}

	private static async Task<UserDto> GetActiveUserAsync(
		IMessageBus messageBus,
		long userId,
		ILogger logger,
		CancellationToken cancellationToken)
	{
		UserDto? user =
			await messageBus.InvokeAsync<UserDto?>(
				new GetUserByIdQuery(userId),
				cancellationToken);

		if (user is null || !user.IsActive)
		{
			logger.LogError(
				"User with ID {UserId} not found or inactive",
				userId);
			throw new InvalidOperationException(
				$"User with ID {userId} not found or inactive");
		}

		return user;
	}

	private static async Task UpdateCredentialAsync(
		ICredentialRepository credentialRepository,
		IPasswordHasher passwordHasher,
		long userId,
		string newPassword,
		DateTime now,
		CancellationToken cancellationToken)
	{
		UserCredential? credential =
			await credentialRepository.GetByUserIdForUpdateAsync(
				userId,
				cancellationToken);
		string passwordHash =
			passwordHasher.HashPassword(newPassword);

		if (credential is null)
		{
			await credentialRepository.CreateAsync(
				new UserCredential
				{
					UserId = userId,
					PasswordHash = passwordHash,
					CreateDate = now,
					PasswordChangedAt = now,
				},
				cancellationToken);
		}
		else
		{
			credential.PasswordHash = passwordHash;
			credential.PasswordChangedAt = now;
			await credentialRepository.UpdateAsync(
				credential,
				cancellationToken);
		}
	}
}