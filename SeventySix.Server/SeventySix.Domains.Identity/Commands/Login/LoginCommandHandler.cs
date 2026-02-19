// <copyright file="LoginCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using SeventySix.Shared.Contracts.Emails;
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
	/// <param name="signInManager">
	/// Identity <see cref="SignInManager{TUser}"/> for password checks and lockout.
	/// </param>
	/// <param name="authRepository">
	/// Repository for single-query user lookups by username or email.
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
	/// <param name="totpSettings">
	/// TOTP configuration settings (used to guard TOTP challenge initiation).
	/// </param>
	/// <param name="trustedDeviceService">
	/// Service for trusted device validation and MFA bypass.
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
		SignInManager<ApplicationUser> signInManager,
		IAuthRepository authRepository,
		AuthenticationService authenticationService,
		IAltchaService altchaService,
		ISecurityAuditService securityAuditService,
		IMfaService mfaService,
		IOptions<MfaSettings> mfaSettings,
		IOptions<TotpSettings> totpSettings,
		ITrustedDeviceService trustedDeviceService,
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
				signInManager,
				authRepository,
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
			// Check if device is trusted (skip MFA)
			AuthResult? trustedDeviceResult =
				await TryBypassMfaViaTrustedDeviceAsync(
					command,
					user!,
					authenticationService,
					securityAuditService,
					trustedDeviceService,
					cancellationToken);

			if (trustedDeviceResult is not null)
			{
				return trustedDeviceResult;
			}

			// Determine available MFA methods based on user enrollment
			bool hasTotpEnrolled =
				!string.IsNullOrEmpty(user!.TotpSecret);

			if (hasTotpEnrolled && totpSettings.Value.Enabled)
			{
				return await InitiateTotpChallengeAsync(
					user,
					command.ClientIp,
					mfaService,
					securityAuditService,
					cancellationToken);
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
	/// <param name="signInManager">
	/// Sign in manager.
	/// </param>
	/// <param name="authRepository">
	/// Repository for single-query user lookups.
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
		SignInManager<ApplicationUser> signInManager,
		IAuthRepository authRepository,
		ISecurityAuditService securityAuditService,
		CancellationToken cancellationToken)
	{
		ApplicationUser? user =
			await authRepository.FindByUsernameOrEmailAsync(
				command.Request.UsernameOrEmail,
				cancellationToken);

		if (!user.IsValidForAuthentication())
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
				EmailTypeConstants.MfaVerification,
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

	/// <summary>
	/// Checks if the login request has a trusted device token and validates it.
	/// Returns a successful auth result if the device is trusted (bypasses MFA).
	/// </summary>
	/// <param name="command">
	/// The login command with trusted device token.
	/// </param>
	/// <param name="user">
	/// The authenticated user.
	/// </param>
	/// <param name="authenticationService">
	/// Service to generate auth tokens.
	/// </param>
	/// <param name="securityAuditService">
	/// Security audit service.
	/// </param>
	/// <param name="trustedDeviceService">
	/// Trusted device validation service.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// AuthResult if MFA was bypassed; null if MFA is still required.
	/// </returns>
	private static async Task<AuthResult?> TryBypassMfaViaTrustedDeviceAsync(
		LoginCommand command,
		ApplicationUser user,
		AuthenticationService authenticationService,
		ISecurityAuditService securityAuditService,
		ITrustedDeviceService trustedDeviceService,
		CancellationToken cancellationToken)
	{
		if (string.IsNullOrEmpty(command.TrustedDeviceToken))
		{
			return null;
		}

		bool isTrusted =
			await trustedDeviceService.ValidateTrustedDeviceAsync(
				user.Id,
				command.TrustedDeviceToken,
				command.UserAgent ?? string.Empty,
				command.ClientIp,
				cancellationToken);

		if (!isTrusted)
		{
			return null;
		}

		await securityAuditService.LogEventAsync(
			SecurityEventType.LoginSuccess,
			user,
			success: true,
			details: "MFA bypassed via trusted device",
			cancellationToken);

		return await authenticationService.GenerateAuthResultAsync(
			user,
			command.ClientIp,
			user.RequiresPasswordChange,
			command.Request.RememberMe,
			cancellationToken);
	}

	/// <summary>
	/// Creates a TOTP challenge token and returns an MFA-required result.
	/// The challenge token serves as proof-of-password for subsequent TOTP verification.
	/// </summary>
	private static async Task<AuthResult> InitiateTotpChallengeAsync(
		ApplicationUser user,
		string? clientIp,
		IMfaService mfaService,
		ISecurityAuditService securityAuditService,
		CancellationToken cancellationToken)
	{
		(string totpChallengeToken, string _) =
			await mfaService.CreateChallengeAsync(
				user.Id,
				clientIp,
				cancellationToken);

		await securityAuditService.LogEventAsync(
			SecurityEventType.MfaChallengeInitiated,
			user,
			success: true,
			details: "TOTP",
			cancellationToken);

		List<MfaMethod> availableMethods =
			[MfaMethod.Totp, MfaMethod.Email, MfaMethod.BackupCode];

		return AuthResult.MfaRequired(
			challengeToken: totpChallengeToken,
			email: user.Email!,
			mfaMethod: MfaMethod.Totp,
			availableMethods: availableMethods);
	}
}