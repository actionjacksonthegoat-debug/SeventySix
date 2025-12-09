// <copyright file="ChangePasswordCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Wolverine;

namespace SeventySix.Identity;

/// <summary>
/// Handler for changing a user's password.
/// </summary>
public static class ChangePasswordCommandHandler
{
	/// <summary>
	/// Handles the change password command.
	/// </summary>
	/// <exception cref="ArgumentException">Thrown when validation fails.</exception>
	public static async Task<AuthResult> HandleAsync(
		ChangePasswordCommand command,
		IValidator<ChangePasswordRequest> changePasswordValidator,
		ICredentialRepository credentialRepository,
		IMessageBus messageBus,
		ITokenRepository tokenRepository,
		IUserRoleRepository userRoleRepository,
		ITokenService tokenService,
		IOptions<JwtSettings> jwtSettings,
		IOptions<AuthSettings> authSettings,
		TimeProvider timeProvider,
		ILogger<ChangePasswordCommand> logger,
		CancellationToken cancellationToken)
	{
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		await changePasswordValidator.ValidateAndThrowAsync(
			command.Request,
			cancellationToken);

		UserCredential? credential =
			await credentialRepository.GetByUserIdForUpdateAsync(
				command.UserId,
				cancellationToken);

		if (credential is null)
		{
			credential =
				new UserCredential
				{
					UserId = command.UserId,
					CreateDate = now,
				};
		}
		else
		{
			bool isCurrentPasswordValid =
				BCrypt.Net.BCrypt.Verify(
					command.Request.CurrentPassword,
					credential.PasswordHash);

			if (!isCurrentPasswordValid)
			{
				throw new ArgumentException(
					"Current password is incorrect",
					nameof(command.Request.CurrentPassword));
			}
		}

		credential.PasswordHash =
			BCrypt.Net.BCrypt.HashPassword(
				command.Request.NewPassword,
				authSettings.Value.Password.WorkFactor);
		credential.PasswordChangedAt = now;

		if (credential.UserId == command.UserId && credential.PasswordHash != string.Empty)
		{
			await credentialRepository.UpdateAsync(
				credential,
				cancellationToken);
		}
		else
		{
			await credentialRepository.CreateAsync(
				credential,
				cancellationToken);
		}

		await tokenRepository.RevokeAllUserTokensAsync(
			command.UserId,
			now,
			cancellationToken);

		UserDto? user =
			await messageBus.InvokeAsync<UserDto?>(
				new GetUserByIdQuery(
					command.UserId),
				cancellationToken);

		if (user is null)
		{
			logger.LogError(
				"User with ID {UserId} not found after password change",
				command.UserId);
			throw new InvalidOperationException($"User with ID {command.UserId} not found");
		}

		return await RegistrationHelpers.GenerateAuthResultAsync(
			user.ToEntity(),
			clientIp: null,
			requiresPasswordChange: false,
			rememberMe: false,
			userRoleRepository,
			tokenService,
			jwtSettings,
			timeProvider,
			cancellationToken);
	}
}
