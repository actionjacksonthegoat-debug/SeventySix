// <copyright file="RegisterCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Identity.Constants;
using SeventySix.Shared.Extensions;

namespace SeventySix.Identity;

/// <summary>
/// Handler for RegisterCommand.
/// </summary>
public static class RegisterCommandHandler
{
	/// <summary>
	/// Handles the RegisterCommand request.
	/// </summary>
	/// <remarks>
	/// Wolverine's UseEntityFrameworkCoreTransactions middleware automatically wraps this handler in a transaction.
	/// Database unique constraints on Username and Email provide atomicity - no manual duplicate checks needed.
	/// </remarks>
	public static async Task<AuthResult> HandleAsync(
		RegisterCommand command,
		IAuthRepository authRepository,
		ICredentialRepository credentialRepository,
		IUserRoleRepository userRoleRepository,
		ITokenService tokenService,
		IOptions<AuthSettings> authSettings,
		IOptions<JwtSettings> jwtSettings,
		TimeProvider timeProvider,
		ILogger<RegisterCommand> logger,
		CancellationToken cancellationToken)
	{
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		// Get role ID (read-only query)
		int userRoleId =
			await RegistrationHelpers.GetRoleIdByNameAsync(
				authRepository,
				RoleConstants.User,
				logger,
				cancellationToken);

		try
		{
			// Create user with credential and role
			User user =
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
					cancellationToken);

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
		catch (DbUpdateException exception) when (exception.IsDuplicateKeyViolation())
		{
			// Database unique constraint violation - check which field caused it
			string message = exception.InnerException?.Message ?? exception.Message;

			if (message.Contains(
				"IX_Users_Username",
				StringComparison.OrdinalIgnoreCase))
			{
				return AuthResult.Failed(
					"Username is already taken.",
					AuthErrorCodes.UsernameExists);
			}

			if (message.Contains(
				"IX_Users_Email",
				StringComparison.OrdinalIgnoreCase))
			{
				return AuthResult.Failed(
					"Email is already registered.",
					AuthErrorCodes.EmailExists);
			}

			// Unknown constraint violation
			return AuthResult.Failed(
				"Username or email already exists.",
				AuthErrorCodes.UsernameExists);
		}
	}
}