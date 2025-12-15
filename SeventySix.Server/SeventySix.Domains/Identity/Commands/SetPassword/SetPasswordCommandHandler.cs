// <copyright file="SetPasswordCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
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
	/// <exception cref="ArgumentException">Thrown when validation fails.</exception>
	/// <exception cref="InvalidOperationException">Thrown when user not found or inactive.</exception>
	public static async Task<AuthResult> HandleAsync(
		SetPasswordCommand command,
		IPasswordResetTokenRepository passwordResetTokenRepository,
		ICredentialRepository credentialRepository,
		IMessageBus messageBus,
		ITokenRepository tokenRepository,
		RegistrationService registrationService,
		IOptions<AuthSettings> authSettings,
		TimeProvider timeProvider,
		ILogger<SetPasswordCommand> logger,
		CancellationToken cancellationToken)
	{
		DateTime now = timeProvider.GetUtcNow().UtcDateTime;

		PasswordResetToken? resetToken =
			await passwordResetTokenRepository.GetByHashAsync(
				command.Request.Token,
				cancellationToken);
		ValidateResetToken(
			resetToken,
			now,
			logger);

		UserDto user = await GetActiveUserAsync(
			messageBus,
			resetToken!.UserId,
			logger,
			cancellationToken);
		await passwordResetTokenRepository.MarkAsUsedAsync(
			resetToken,
			cancellationToken);

		await UpdateCredentialAsync(
			credentialRepository,
			user.Id,
			command.Request.NewPassword,
			authSettings,
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

	private static void ValidateResetToken(PasswordResetToken? token, DateTime now, ILogger logger)
	{
		if (token is null)
		{
			logger.LogWarning("Password reset token not found");
			throw new ArgumentException("Invalid or expired password reset token", "Token");
		}

		if (token.IsUsed)
		{
			logger.LogWarning("Password reset token already used for user {UserId}", token.UserId);
			throw new ArgumentException("Invalid or expired password reset token", "Token");
		}

		if (token.ExpiresAt < now)
		{
			logger.LogWarning("Password reset token expired for user {UserId}", token.UserId);
			throw new ArgumentException("Invalid or expired password reset token", "Token");
		}
	}

	private static async Task<UserDto> GetActiveUserAsync(
		IMessageBus messageBus,
		int userId,
		ILogger logger,
		CancellationToken cancellationToken)
	{
		UserDto? user = await messageBus.InvokeAsync<UserDto?>(new GetUserByIdQuery(userId), cancellationToken);

		if (user is null || !user.IsActive)
		{
			logger.LogError("User with ID {UserId} not found or inactive", userId);
			throw new InvalidOperationException($"User with ID {userId} not found or inactive");
		}

		return user;
	}

	private static async Task UpdateCredentialAsync(
		ICredentialRepository credentialRepository,
		int userId,
		string newPassword,
		IOptions<AuthSettings> authSettings,
		DateTime now,
		CancellationToken cancellationToken)
	{
		UserCredential? credential = await credentialRepository.GetByUserIdForUpdateAsync(userId, cancellationToken);
		string passwordHash = BCrypt.Net.BCrypt.HashPassword(newPassword, authSettings.Value.Password.WorkFactor);

		if (credential is null)
		{
			await credentialRepository.CreateAsync(new UserCredential
			{
				UserId = userId,
				PasswordHash = passwordHash,
				CreateDate = now,
				PasswordChangedAt = now,
			}, cancellationToken);
		}
		else
		{
			credential.PasswordHash = passwordHash;
			credential.PasswordChangedAt = now;
			await credentialRepository.UpdateAsync(credential, cancellationToken);
		}
	}
}