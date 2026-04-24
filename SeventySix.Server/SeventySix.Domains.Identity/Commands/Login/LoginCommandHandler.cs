// <copyright file="LoginCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

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
	/// <param name="mfaChallengeDispatcher">
	/// Dispatches MFA challenges (TOTP or email) when MFA is required.
	/// </param>
	/// <param name="trustedDeviceService">
	/// Service for trusted device validation and MFA bypass.
	/// </param>
	/// <param name="mfaSettings">
	/// MFA configuration settings used to determine if MFA is required.
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
		IAuthenticationService authenticationService,
		IAltchaService altchaService,
		ISecurityAuditService securityAuditService,
		IMfaChallengeDispatcher mfaChallengeDispatcher,
		ITrustedDeviceService trustedDeviceService,
		IOptions<MfaSettings> mfaSettings,
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

		if (IsMfaRequired(
			user!,
			mfaSettings.Value))
		{
			AuthResult? trustedDeviceResult =
				await TryBypassViaTrustedDeviceAsync(
					command,
					user!,
					trustedDeviceService,
					securityAuditService,
					authenticationService,
					cancellationToken);

			if (trustedDeviceResult is not null)
			{
				return trustedDeviceResult;
			}

			return await mfaChallengeDispatcher.InitiateChallengeAsync(
				user!,
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
			user!.RequiresPasswordChange,
			command.Request.RememberMe,
			cancellationToken);
	}

	/// <summary>
	/// Determines whether MFA is required for the given user.
	/// </summary>
	/// <param name="user">
	/// The authenticated user.
	/// </param>
	/// <param name="settings">
	/// MFA configuration settings.
	/// </param>
	/// <returns>
	/// True if MFA is required; false if login can proceed without MFA.
	/// </returns>
	private static bool IsMfaRequired(ApplicationUser user, MfaSettings settings) =>
		settings.Enabled && (settings.RequiredForAllUsers || user.MfaEnabled);

	/// <summary>
	/// Attempts to bypass MFA via a trusted device token.
	/// </summary>
	/// <param name="command">
	/// The login command containing the trusted device token and user agent.
	/// </param>
	/// <param name="user">
	/// The authenticated user.
	/// </param>
	/// <param name="trustedDeviceService">
	/// Service for trusted device validation.
	/// </param>
	/// <param name="securityAuditService">
	/// Service for logging security audit events.
	/// </param>
	/// <param name="authenticationService">
	/// Service to generate auth tokens when bypass succeeds.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A successful <see cref="AuthResult"/> if the device is trusted and MFA is bypassed;
	/// null if MFA is still required.
	/// </returns>
	private static async Task<AuthResult?> TryBypassViaTrustedDeviceAsync(
		LoginCommand command,
		ApplicationUser user,
		ITrustedDeviceService trustedDeviceService,
		ISecurityAuditService securityAuditService,
		IAuthenticationService authenticationService,
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
			user.RequiresPasswordChange,
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

		if (user is null || !user.IsValidForAuthentication())
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
}