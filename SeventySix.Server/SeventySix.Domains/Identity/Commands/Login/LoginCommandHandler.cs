// <copyright file="LoginCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using SeventySix.ElectronicNotifications.Emails;
using Wolverine;

namespace SeventySix.Identity;

/// <summary>
/// Handler for login command.
/// </summary>
/// <remarks>
/// Thin wrapper that delegates credential checks to Identity's <see cref="SignInManager{TUser}"/>.
/// Includes ALTCHA Proof-of-Work validation when enabled.
/// Supports MFA when configured globally or per-user.
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
	/// <param name="mfaService">
	/// MFA service for challenge creation.
	/// </param>
	/// <param name="mfaSettings">
	/// MFA configuration settings.
	/// </param>
	/// <param name="messageBus">
	/// Message bus for enqueueing emails.
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
		IMfaService mfaService,
		IOptions<MfaSettings> mfaSettings,
		IMessageBus messageBus,
		CancellationToken cancellationToken)
	{
		AuthResult? altchaFailure =
			await ValidateAltchaAsync(
				command,
				altchaService,
				securityAuditService,
				cancellationToken);
		if (altchaFailure is not null)
		{
			return altchaFailure;
		}

		(ApplicationUser? user, AuthResult? credentialFailure) =
			await ValidateCredentialsAsync(
				command,
				userManager,
				signInManager,
				securityAuditService,
				cancellationToken);
		if (credentialFailure is not null)
		{
			return credentialFailure;
		}

		// Check if MFA is required
		MfaSettings mfaConfig =
			mfaSettings.Value;
		bool mfaRequired =
			mfaConfig.Enabled
			&& (mfaConfig.RequiredForAllUsers || user!.MfaEnabled);

		if (mfaRequired)
		{
			// Determine available MFA methods based on user enrollment
			bool hasTotpEnrolled =
				!string.IsNullOrEmpty(user!.TotpSecret);

			if (hasTotpEnrolled)
			{
				// User has TOTP enrolled - prefer TOTP (no email sent)
				await securityAuditService.LogEventAsync(
					SecurityEventType.MfaChallengeInitiated,
					user,
					success: true,
					details: "TOTP",
					cancellationToken);

				List<MfaMethod> availableMethods =
					[MfaMethod.Totp, MfaMethod.Email, MfaMethod.BackupCode];

				return AuthResult.MfaRequired(
					challengeToken: null,
					email: user.Email!,
					mfaMethod: MfaMethod.Totp,
					availableMethods: availableMethods);
			}

			// Fall back to email-based MFA
			return await InitiateMfaChallengeAsync(
				user!,
				command.ClientIp,
				(mfaService, mfaConfig),
				messageBus,
				securityAuditService,
				cancellationToken);
		}

		await securityAuditService.LogEventAsync(
			SecurityEventType.LoginSuccess,
			user!,
			success: true,
			details: null,
			cancellationToken);

		return await authenticationService.GenerateAuthResultAsync(
			user!,
			command.ClientIp,
			user!.RequiresPasswordChange,
			command.Request.RememberMe,
			cancellationToken);
	}

	/// <summary>
	/// Validates ALTCHA Proof-of-Work if enabled.
	/// </summary>
	/// <param name="command">
	/// The login command.
	/// </param>
	/// <param name="altchaService">
	/// ALTCHA service.
	/// </param>
	/// <param name="securityAuditService">
	/// Security audit service.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// AuthResult failure if validation fails, null if successful or not enabled.
	/// </returns>
	private static async Task<AuthResult?> ValidateAltchaAsync(
		LoginCommand command,
		IAltchaService altchaService,
		ISecurityAuditService securityAuditService,
		CancellationToken cancellationToken)
	{
		if (!altchaService.IsEnabled)
		{
			return null;
		}

		AltchaValidationResult altchaResult =
			await altchaService.ValidateAsync(
				command.Request.AltchaPayload ?? string.Empty,
				cancellationToken);

		if (altchaResult.Success)
		{
			return null;
		}

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

	/// <summary>
	/// Validates user credentials.
	/// </summary>
	/// <param name="command">
	/// The login command.
	/// </param>
	/// <param name="userManager">
	/// User manager.
	/// </param>
	/// <param name="signInManager">
	/// Sign in manager.
	/// </param>
	/// <param name="securityAuditService">
	/// Security audit service.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Tuple of user (if found) and failure result (if validation failed).
	/// </returns>
	private static async Task<(ApplicationUser? User, AuthResult? Failure)> ValidateCredentialsAsync(
		LoginCommand command,
		UserManager<ApplicationUser> userManager,
		SignInManager<ApplicationUser> signInManager,
		ISecurityAuditService securityAuditService,
		CancellationToken cancellationToken)
	{
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
			return (
				null,
				AuthResult.Failed(
					AuthErrorMessages.InvalidCredentials,
					AuthErrorCodes.InvalidCredentials));
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
			return (
				user,
				AuthResult.Failed(
					AuthErrorMessages.AccountLocked,
					AuthErrorCodes.AccountLocked));
		}

		if (!signInResult.Succeeded)
		{
			await securityAuditService.LogEventAsync(
				SecurityEventType.LoginFailed,
				user,
				success: false,
				details: null,
				cancellationToken);
			return (
				user,
				AuthResult.Failed(
					AuthErrorMessages.InvalidCredentials,
					AuthErrorCodes.InvalidCredentials));
		}

		return (user, null);
	}

	/// <summary>
	/// Initiates MFA challenge for the user.
	/// </summary>
	/// <param name="user">
	/// The authenticated user requiring MFA.
	/// </param>
	/// <param name="clientIp">
	/// Client IP address.
	/// </param>
	/// <param name="mfaContext">
	/// MFA service and configuration tuple.
	/// </param>
	/// <param name="messageBus">
	/// Message bus for enqueueing emails.
	/// </param>
	/// <param name="securityAuditService">
	/// Security audit service for logging.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// AuthResult requiring MFA verification.
	/// </returns>
	private static async Task<AuthResult> InitiateMfaChallengeAsync(
		ApplicationUser user,
		string? clientIp,
		(IMfaService Service, MfaSettings Config) mfaContext,
		IMessageBus messageBus,
		ISecurityAuditService securityAuditService,
		CancellationToken cancellationToken)
	{
		(string challengeToken, string code) =
			await mfaContext.Service.CreateChallengeAsync(
				user.Id,
				clientIp,
				cancellationToken);

		await messageBus.InvokeAsync(
			new EnqueueEmailCommand(
				EmailType.MfaVerification,
				user.Email!,
				user.Id,
				new Dictionary<string, string>
				{
					["code"] =
						code,
					["expirationMinutes"] =
						mfaContext.Config.CodeExpirationMinutes.ToString()
				}),
			cancellationToken);

		await securityAuditService.LogEventAsync(
			SecurityEventType.MfaChallengeInitiated,
			user,
			success: true,
			details: "Email",
			cancellationToken);

		List<MfaMethod> availableMethods =
			[MfaMethod.Email];

		return AuthResult.MfaRequired(
			challengeToken,
			user.Email!,
			mfaMethod: MfaMethod.Email,
			availableMethods: availableMethods);
	}
}