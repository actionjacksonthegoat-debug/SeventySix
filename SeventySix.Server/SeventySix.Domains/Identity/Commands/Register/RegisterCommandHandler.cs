// <copyright file="RegisterCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using SeventySix.Identity.Constants;

namespace SeventySix.Identity;

/// <summary>
/// Handler for RegisterCommand.
/// </summary>
/// <remarks>
/// Creates an Identity user and assigns the `User` role. Role seeding must be executed during migration/startup.
/// Includes ALTCHA Proof-of-Work validation when enabled.
/// </remarks>
public static class RegisterCommandHandler
{
	/// <summary>
	/// Handles the RegisterCommand request by creating a new Identity user and returning tokens.
	/// </summary>
	/// <param name="command">
	/// The registration request and client IP.
	/// </param>
	/// <param name="userManager">
	/// Identity <see cref="UserManager{TUser}"/> for creating users and roles.
	/// </param>
	/// <param name="authenticationService">
	/// Service to generate authentication tokens.
	/// </param>
	/// <param name="altchaService">
	/// Service for ALTCHA Proof-of-Work validation.
	/// </param>
	/// <param name="timeProvider">
	/// Time provider for obtaining current UTC times.
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
	public static async Task<AuthResult> HandleAsync(
		RegisterCommand command,
		UserManager<ApplicationUser> userManager,
		AuthenticationService authenticationService,
		IAltchaService altchaService,
		TimeProvider timeProvider,
		ILogger<RegisterCommand> logger,
		CancellationToken cancellationToken)
	{
		// Validate ALTCHA if enabled
		if (altchaService.IsEnabled)
		{
			AltchaValidationResult altchaResult =
				await altchaService.ValidateAsync(
					command.Request.AltchaPayload ?? string.Empty,
					cancellationToken);

			if (!altchaResult.Success)
			{
				// Return generic error to avoid revealing validation details to bots
				return AuthResult.Failed(
					"Registration failed",
					"REGISTRATION_FAILED");
			}
		}

		ApplicationUser newUser =
			new()
			{
				UserName = command.Request.Username,
				Email = command.Request.Email,
				FullName = command.Request.FullName,
				IsActive = true,
				CreateDate =
					timeProvider.GetUtcNow().UtcDateTime,
				CreatedBy = "Registration",
			};

		IdentityResult result =
			await userManager.CreateAsync(
				newUser,
				command.Request.Password);

		if (!result.Succeeded)
		{
			string errors =
				string.Join(
					", ",
					result.Errors.Select(error => error.Description));

			return AuthResult.Failed(
				errors,
				"REGISTRATION_FAILED");
		}

		await userManager.AddToRoleAsync(
			newUser,
			RoleConstants.User);

		return await authenticationService.GenerateAuthResultAsync(
			newUser,
			command.ClientIp,
			requiresPasswordChange: false,
			rememberMe: false,
			cancellationToken);
	}
}