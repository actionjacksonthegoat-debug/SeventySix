// <copyright file="SetPasswordCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
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
		IValidator<SetPasswordRequest> setPasswordValidator,
		IPasswordResetTokenRepository passwordResetTokenRepository,
		ICredentialRepository credentialRepository,
		IMessageBus messageBus,
		ITokenRepository tokenRepository,
		IUserRoleRepository userRoleRepository,
		ITokenService tokenService,
		IOptions<JwtSettings> jwtSettings,
		IOptions<AuthSettings> authSettings,
		TimeProvider timeProvider,
		ILogger<SetPasswordCommand> logger,
		CancellationToken cancellationToken)
	{
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		await setPasswordValidator.ValidateAndThrowAsync(
			command.Request,
			cancellationToken);

		PasswordResetToken? resetToken =
			await passwordResetTokenRepository.GetByHashAsync(
				command.Request.Token,
				cancellationToken);

		if (resetToken is null)
		{
			logger.LogWarning(
				"Password reset token not found");
			throw new ArgumentException(
				"Invalid or expired password reset token",
				nameof(command.Request.Token));
		}

		if (resetToken.IsUsed)
		{
			logger.LogWarning(
				"Password reset token already used for user {UserId}",
				resetToken.UserId);
			throw new ArgumentException(
				"Invalid or expired password reset token",
				nameof(command.Request.Token));
		}

		if (resetToken.ExpiresAt < now)
		{
			logger.LogWarning(
				"Password reset token expired for user {UserId}",
				resetToken.UserId);
			throw new ArgumentException(
				"Invalid or expired password reset token",
				nameof(command.Request.Token));
		}

		UserDto? user =
			await messageBus.InvokeAsync<UserDto?>(
				new GetUserByIdQuery(
					resetToken.UserId),
				cancellationToken);

		if (user is null || !user.IsActive)
		{
			logger.LogError(
				"User with ID {UserId} not found or inactive",
				resetToken.UserId);
			throw new InvalidOperationException($"User with ID {resetToken.UserId} not found or inactive");
		}

		await passwordResetTokenRepository.MarkAsUsedAsync(
			resetToken,
			cancellationToken);

		UserCredential? credential =
			await credentialRepository.GetByUserIdForUpdateAsync(
				user.Id,
				cancellationToken);

		string passwordHash =
			BCrypt.Net.BCrypt.HashPassword(
				command.Request.NewPassword,
				authSettings.Value.Password.WorkFactor);

		if (credential is null)
		{
			credential =
				new UserCredential
				{
					UserId = user.Id,
					PasswordHash = passwordHash,
					CreateDate = now,
					PasswordChangedAt = now,
				};
			await credentialRepository.CreateAsync(
				credential,
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

		await tokenRepository.RevokeAllUserTokensAsync(
			user.Id,
			now,
			cancellationToken);

		return await RegistrationHelpers.GenerateAuthResultAsync(
			user.ToEntity(),
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