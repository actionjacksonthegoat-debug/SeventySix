// <copyright file="CompleteRegistrationCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SeventySix.Identity.Constants;
using SeventySix.Shared.Extensions;

namespace SeventySix.Identity;

/// <summary>
/// Handler for CompleteRegistrationCommand.
/// </summary>
/// <remarks>
/// Uses ASP.NET Core Identity's email confirmation token system.
/// The temporary user created in InitiateRegistration is updated with
/// the username and password, then activated.
/// </remarks>
public static class CompleteRegistrationCommandHandler
{
	/// <summary>
	/// Handles the CompleteRegistrationCommand request.
	/// </summary>
	/// <param name="command">
	/// The complete registration command containing token and client IP.
	/// </param>
	/// <param name="userManager">
	/// Identity <see cref="UserManager{TUser}"/> for creating users and roles.
	/// </param>
	/// <param name="authenticationService">
	/// Service to generate auth tokens on success.
	/// </param>
	/// <param name="timeProvider">
	/// Time provider for timestamps.
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
		UserManager<ApplicationUser> userManager,
		AuthenticationService authenticationService,
		TimeProvider timeProvider,
		ILogger<CompleteRegistrationCommand> logger,
		CancellationToken cancellationToken)
	{
		// Find the user by email from the request
		// The temporary user was created in InitiateRegistration
		ApplicationUser? existingUser =
			await userManager.FindByEmailAsync(command.Request.Email);

		if (existingUser is null)
		{
			logger.LogWarning(
				"Attempted to complete registration for non-existent email: {Email}",
				command.Request.Email);

			return AuthResult.Failed(
				"Invalid or expired verification link.",
				AuthErrorCodes.InvalidToken);
		}

		// Verify the email confirmation token using Identity's token provider
		IdentityResult confirmResult =
			await userManager.ConfirmEmailAsync(existingUser, command.Request.Token);

		if (!confirmResult.Succeeded)
		{
			string errors =
				string.Join(", ", confirmResult.Errors.Select(error => error.Description));
			logger.LogWarning(
				"Email confirmation failed for {Email}: {Errors}",
				command.Request.Email,
				errors);

			return AuthResult.Failed(
				"Invalid or expired verification link.",
				AuthErrorCodes.InvalidToken);
		}

		try
		{
			ApplicationUser completedUser =
				await CompleteUserRegistrationAsync(
					command,
					existingUser,
					userManager,
					timeProvider);

			return await authenticationService.GenerateAuthResultAsync(
				completedUser,
				command.ClientIp,
				requiresPasswordChange: false,
				rememberMe: false,
				cancellationToken);
		}
		catch (InvalidOperationException exception)
		{
			// Identity update failed due to validation (e.g., username already taken)
			return AuthResult.Failed(
				exception.Message,
				"REGISTRATION_FAILED");
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

	/// <summary>
	/// Completes the user registration by setting username, password, and activating the account.
	/// </summary>
	/// <param name="command">
	/// Complete registration command containing username and password.
	/// </param>
	/// <param name="existingUser">
	/// The temporary user created during InitiateRegistration.
	/// </param>
	/// <param name="userManager">
	/// Identity <see cref="UserManager{TUser}"/> used to update the user.
	/// </param>
	/// <param name="timeProvider">
	/// Time provider for timestamps.
	/// </param>
	/// <returns>
	/// The completed <see cref="ApplicationUser"/>.
	/// </returns>
	private static async Task<ApplicationUser> CompleteUserRegistrationAsync(
		CompleteRegistrationCommand command,
		ApplicationUser existingUser,
		UserManager<ApplicationUser> userManager,
		TimeProvider timeProvider)
	{
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		// Update the temporary user with registration details
		existingUser.UserName = command.Request.Username;
		existingUser.IsActive = true;
		existingUser.ModifyDate = now;
		existingUser.ModifiedBy = "Self-Registration";

		IdentityResult updateResult =
			await userManager.UpdateAsync(existingUser);

		if (!updateResult.Succeeded)
		{
			throw new InvalidOperationException(
				string.Join(
					", ",
					updateResult.Errors.Select(error => error.Description)));
		}

		// Add password (temporary user was created without one)
		IdentityResult passwordResult =
			await userManager.AddPasswordAsync(existingUser, command.Request.Password);

		if (!passwordResult.Succeeded)
		{
			throw new InvalidOperationException(
				string.Join(
					", ",
					passwordResult.Errors.Select(error => error.Description)));
		}

		// Assign User role
		IdentityResult roleResult =
			await userManager.AddToRoleAsync(existingUser, RoleConstants.User);

		if (!roleResult.Succeeded)
		{
			throw new InvalidOperationException(
				string.Join(
					", ",
					roleResult.Errors.Select(error => error.Description)));
		}

		return existingUser;
	}
}