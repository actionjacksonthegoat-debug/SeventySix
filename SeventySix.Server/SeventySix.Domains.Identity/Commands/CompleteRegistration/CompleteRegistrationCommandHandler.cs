// <copyright file="CompleteRegistrationCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SeventySix.Identity.Constants;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Extensions;
using SeventySix.Shared.Interfaces;
using SeventySix.Shared.POCOs;
using SeventySix.Shared.Utilities;

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
	/// <param name="breachCheck">
	/// Compound dependency for breach checking (service + settings).
	/// </param>
	/// <param name="timeProvider">
	/// Time provider for timestamps.
	/// </param>
	/// <param name="logger">
	/// Logger instance.
	/// </param>
	/// <param name="transactionManager">
	/// Transaction manager for concurrency-safe multi-step registration.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// An <see cref="AuthResult"/> containing access and refresh tokens on success.
	/// </returns>
	public static async Task<AuthResult> HandleAsync(
		CompleteRegistrationCommand command,
		UserManager<ApplicationUser> userManager,
		AuthenticationService authenticationService,
		BreachCheckDependencies breachCheck,
		TimeProvider timeProvider,
		ILogger<CompleteRegistrationCommand> logger,
		ITransactionManager transactionManager,
		CancellationToken cancellationToken)
	{
		// Check password against known breaches (OWASP ASVS V2.1.7)
		// (outside transaction — external HTTP call to HIBP)
		AuthResult? breachError =
			await breachCheck.ValidatePasswordNotBreachedAsync(
				command.Request.Password,
				logger,
				cancellationToken: cancellationToken);

		if (breachError is not null)
		{
			return breachError;
		}

		// Closure variables for results passed out of the transaction lambda
		AuthResult? earlyResult = null;
		ApplicationUser? transactedUser = null;
		string? capturedDecodedEmail = null;

		await transactionManager.ExecuteInTransactionAsync(
			async ct =>
			{
				// Reset closure state for retries
				earlyResult = null;
				transactedUser = null;
				capturedDecodedEmail = null;

				// Validate registration token and confirm user email
				(ApplicationUser? existingUser, string? decodedEmail, AuthResult? tokenError) =
					await ValidateTokenAsync(
						command.Request.Token,
						userManager,
						logger);

				if (tokenError is not null)
				{
					earlyResult = tokenError;
					return;
				}

				capturedDecodedEmail = decodedEmail;

				try
				{
					transactedUser =
						await CompleteUserRegistrationAsync(
							command,
							existingUser!,
							userManager,
							timeProvider);
				}
				catch (InvalidOperationException exception)
				{
					// Identity update failed due to validation (e.g., username already taken)
					logger.LogWarning(
						exception,
						"Registration failed: {Error}",
						exception.Message);

					earlyResult =
						AuthResult.Failed(
							ProblemDetailConstants.Details.RegistrationFailed,
							"REGISTRATION_FAILED");
				}
				catch (DbUpdateException exception)
					when (exception.IsDuplicateKeyViolation())
				{
					earlyResult =
						DuplicateKeyViolationHandler.HandleAsAuthResult(
							exception,
							command.Request.Username,
							capturedDecodedEmail!,
							logger);
				}
			},
			cancellationToken: cancellationToken);

		if (earlyResult is not null)
		{
			return earlyResult;
		}

		// Generate auth tokens outside transaction (creates JWT access/refresh tokens)
		return await authenticationService.GenerateAuthResultAsync(
			transactedUser!,
			command.ClientIp,
			requiresPasswordChange: false,
			rememberMe: false,
			cancellationToken);
	}

	/// <summary>
	/// Validates the registration token, finds the user, and confirms their email.
	/// </summary>
	/// <param name="token">
	/// The combined registration token from the verification link.
	/// </param>
	/// <param name="userManager">
	/// Identity <see cref="UserManager{TUser}"/> for user lookup and email confirmation.
	/// </param>
	/// <param name="logger">
	/// Logger instance.
	/// </param>
	/// <returns>
	/// A tuple of (User, DecodedEmail, Error). On success, Error is null.
	/// On failure, User and DecodedEmail are null and Error contains the result.
	/// </returns>
	private static async Task<
		(
			ApplicationUser? User,
			string? DecodedEmail,
			AuthResult? Error
		)> ValidateTokenAsync(
			string token,
			UserManager<ApplicationUser> userManager,
			ILogger logger)
	{
		CombinedRegistrationTokenDto? decodedToken =
			RegistrationTokenService.Decode(token);

		if (decodedToken is null)
		{
			logger.LogWarning(
				"Invalid combined registration token format");

			return
			(
				null,
				null,
				AuthResult.Failed(
					"Invalid or expired verification link.",
					AuthErrorCodes.InvalidToken)
			);
		}

		string decodedEmail =
			decodedToken.Email;

		ApplicationUser? existingUser =
			await userManager.FindByEmailAsync(
				decodedEmail);

		if (existingUser is null)
		{
			logger.LogWarning(
				"Attempted to complete registration for non-existent email: {Email}",
				// codeql[cs/exposure-of-sensitive-information] -- email masked via LogSanitizer.MaskEmail (first char + domain only)
				LogSanitizer.MaskEmail(decodedEmail));

			return
			(
				null,
				null,
				AuthResult.Failed(
					"Invalid or expired verification link.",
					AuthErrorCodes.InvalidToken)
			);
		}

		IdentityResult confirmResult =
			await userManager.ConfirmEmailAsync(
				existingUser,
				decodedToken.Token);

		if (!confirmResult.Succeeded)
		{
			string errors = confirmResult.ToErrorString();
			logger.LogWarning(
				"Email confirmation failed for {Email}: {Errors}",
				// codeql[cs/exposure-of-sensitive-information] -- email masked via LogSanitizer.MaskEmail (first char + domain only)
				LogSanitizer.MaskEmail(decodedEmail),
				errors);

			return
			(
				null,
				null,
				AuthResult.Failed(
					"Invalid or expired verification link.",
					AuthErrorCodes.InvalidToken)
			);
		}

		return (existingUser, decodedEmail, null);
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
		DateTimeOffset now =
			timeProvider.GetUtcNow();

		// Update the temporary user with registration details
		existingUser.UserName = command.Request.Username;
		existingUser.IsActive = true;
		existingUser.ModifyDate = now;
		existingUser.ModifiedBy = "Self-Registration";

		IdentityResult updateResult =
			await userManager.UpdateAsync(
				existingUser);

		if (!updateResult.Succeeded)
		{
			throw new InvalidOperationException(updateResult.ToErrorString());
		}

		// Add password (temporary user was created without one)
		IdentityResult passwordResult =
			await userManager.AddPasswordAsync(
				existingUser,
				command.Request.Password);

		if (!passwordResult.Succeeded)
		{
			throw new InvalidOperationException(passwordResult.ToErrorString());
		}

		// Assign User role
		IdentityResult roleResult =
			await userManager.AddToRoleAsync(
				existingUser,
				RoleConstants.User);

		if (!roleResult.Succeeded)
		{
			throw new InvalidOperationException(roleResult.ToErrorString());
		}

		return existingUser;
	}
}