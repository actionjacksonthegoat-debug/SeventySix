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
		RegistrationService registrationService,
		ILogger<RegisterCommand> logger,
		CancellationToken cancellationToken)
	{
		// Get role ID (read-only query)
		int userRoleId =
			await registrationService.GetRoleIdByNameAsync(
				RoleConstants.User,
				cancellationToken);

		try
		{
			// Create user with credential and role
			User user =
				await registrationService.CreateUserWithCredentialAsync(
					command.Request.Username,
					command.Request.Email,
					command.Request.FullName,
					command.Request.Password,
					"Registration",
					userRoleId,
					requiresPasswordChange: true,
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