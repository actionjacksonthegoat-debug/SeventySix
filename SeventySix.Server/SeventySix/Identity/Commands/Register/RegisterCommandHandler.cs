// <copyright file="RegisterCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Identity.Constants;
using SeventySix.Shared;

namespace SeventySix.Identity;

/// <summary>
/// Handler for RegisterCommand.
/// </summary>
public static class RegisterCommandHandler
{
	/// <summary>
	/// Handles the RegisterCommand request.
	/// </summary>
	public static async Task<AuthResult> HandleAsync(
		RegisterCommand command,
		IUserValidationRepository userValidationRepository,
		IAuthRepository authRepository,
		ICredentialRepository credentialRepository,
		IUserRoleRepository userRoleRepository,
		ITokenService tokenService,
		IOptions<AuthSettings> authSettings,
		IOptions<JwtSettings> jwtSettings,
		TimeProvider timeProvider,
		ITransactionManager transactionManager,
		ILogger<RegisterCommand> logger,
		CancellationToken cancellationToken)
	{
		// Check for existing username
		bool usernameExists =
			await userValidationRepository.UsernameExistsAsync(
				command.Request.Username,
				excludeId: null,
				cancellationToken);

		if (usernameExists)
		{
			return AuthResult.Failed(
				"Username is already taken.",
				AuthErrorCodes.UsernameExists);
		}

		// Check for existing email
		bool emailExists =
			await userValidationRepository.EmailExistsAsync(
				command.Request.Email,
				excludeId: null,
				cancellationToken);

		if (emailExists)
		{
			return AuthResult.Failed(
				"Email is already registered.",
				AuthErrorCodes.EmailExists);
		}

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

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
							command.Request.Email,
							command.Request.FullName,
							command.Request.Password,
							"Registration",
							userRoleId,
							requiresPasswordChange: true,
							authSettings,
							now,
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
