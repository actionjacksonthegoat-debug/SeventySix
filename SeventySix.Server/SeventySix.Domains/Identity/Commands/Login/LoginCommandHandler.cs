// <copyright file="LoginCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Handler for login command.
/// </summary>
/// <remarks>
/// Thin wrapper that delegates credential checks to Identity's <see cref="SignInManager{TUser}"/>.
/// Includes ALTCHA Proof-of-Work validation when enabled.
/// Logs security audit events for compliance and forensics.
/// </remarks>
public static class LoginCommandHandler
{
	/// <summary>
	/// Handles login command by delegating credential validation to Identity's <see cref="SignInManager{TUser}"/>.
	/// </summary>
	/// <param name="command">
	/// The login command containing credentials and options.
	/// </param>
	/// <param name="userManager">
	/// Identity <see cref="UserManager{TUser}"/> for user lookups.
	/// </param>
	/// <param name="signInManager">
	/// Identity <see cref="SignInManager{TUser}"/> for password checks and lockout.
	/// </param>
	/// <param name="authenticationService">
	/// Service to generate auth tokens on success.
	/// </param>
	/// <param name="altchaService">
	/// Service for ALTCHA Proof-of-Work validation.
	/// </param>
	/// <param name="securityAuditService">
	/// Service for logging security audit events.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// An <see cref="AuthResult"/> indicating authentication result.
	/// </returns>
	public static async Task<AuthResult> HandleAsync(
		LoginCommand command,
		UserManager<ApplicationUser> userManager,
		SignInManager<ApplicationUser> signInManager,
		AuthenticationService authenticationService,
		IAltchaService altchaService,
		ISecurityAuditService securityAuditService,
		CancellationToken cancellationToken)
	{
		if (altchaService.IsEnabled)
		{
			AltchaValidationResult altchaResult =
				await altchaService.ValidateAsync(
					command.Request.AltchaPayload ?? string.Empty,
					cancellationToken);

			if (!altchaResult.Success)
			{
				await securityAuditService.LogEventAsync(
					SecurityEventType.AltchaFailed,
					userId: null,
					username: command.Request.UsernameOrEmail,
					success: false,
					details: null,
					cancellationToken);
				return AuthResult.Failed(
					AuthErrorMessages.InvalidCredentials,
					AuthErrorCodes.InvalidCredentials);
			}
		}

		ApplicationUser? user =
			await userManager.FindByNameAsync(command.Request.UsernameOrEmail)
				?? await userManager.FindByEmailAsync(command.Request.UsernameOrEmail);

		if (user is null || !user.IsActive)
		{
			await securityAuditService.LogEventAsync(
				SecurityEventType.LoginFailed,
				userId: null,
				username: command.Request.UsernameOrEmail,
				success: false,
				details: user is null ? "User not found" : "User inactive",
				cancellationToken);
			return AuthResult.Failed(
				AuthErrorMessages.InvalidCredentials,
				AuthErrorCodes.InvalidCredentials);
		}

		SignInResult signInResult =
			await signInManager.CheckPasswordSignInAsync(
				user,
				command.Request.Password,
				lockoutOnFailure: true);

		if (signInResult.IsLockedOut)
		{
			await securityAuditService.LogEventAsync(
				SecurityEventType.AccountLocked,
				user,
				success: false,
				details: null,
				cancellationToken);
			return AuthResult.Failed(
				AuthErrorMessages.AccountLocked,
				AuthErrorCodes.AccountLocked);
		}

		if (!signInResult.Succeeded)
		{
			await securityAuditService.LogEventAsync(
				SecurityEventType.LoginFailed,
				user,
				success: false,
				details: null,
				cancellationToken);
			return AuthResult.Failed(
				AuthErrorMessages.InvalidCredentials,
				AuthErrorCodes.InvalidCredentials);
		}

		await securityAuditService.LogEventAsync(
			SecurityEventType.LoginSuccess,
			user,
			success: true,
			details: null,
			cancellationToken);

		return await authenticationService.GenerateAuthResultAsync(
			user,
			command.ClientIp,
			user.RequiresPasswordChange,
			command.Request.RememberMe,
			cancellationToken);
	}
}