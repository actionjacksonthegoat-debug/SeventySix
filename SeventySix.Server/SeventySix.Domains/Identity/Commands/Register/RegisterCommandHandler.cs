// <copyright file="RegisterCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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
	/// <param name="command">
	/// The registration request and client IP.
	/// </param>
	/// <param name="registrationService">
	/// Service that creates users and returns auth results.
	/// </param>
	/// <param name="logger">
	/// Logger instance used for warnings and errors.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// An <see cref="AuthResult"/> containing access and refresh tokens.
	/// </returns>
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
		long userRoleId =
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
		catch (DbUpdateException exception)
			when (exception.IsDuplicateKeyViolation())
		{
			return DuplicateKeyViolationHandler.HandleAsAuthResult(
				exception,
				command.Request.Username,
				command.Request.Email,
				logger);
		}
	}
}