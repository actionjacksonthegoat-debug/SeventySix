// <copyright file="VerifyTotpCodeCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Handler for TOTP code verification command.
/// Validates the MFA challenge token (proof of prior password authentication)
/// before verifying the TOTP code.
/// </summary>
public static class VerifyTotpCodeCommandHandler
{
	/// <summary>
	/// Handles TOTP verification and issues tokens on success.
	/// </summary>
	/// <param name="command">
	/// The verification command.
	/// </param>
	/// <param name="totpService">
	/// TOTP service for code validation.
	/// </param>
	/// <param name="totpSecretProtector">
	/// Protector for encrypting/decrypting TOTP secrets at rest.
	/// </param>
	/// <param name="userManager">
	/// Identity UserManager for user lookup.
	/// </param>
	/// <param name="authenticationService">
	/// Service to generate auth tokens.
	/// </param>
	/// <param name="securityAuditService">
	/// Security audit logging service.
	/// </param>
	/// <param name="trustedDeviceService">
	/// Service for creating trusted device tokens.
	/// </param>
	/// <param name="mfaService">
	/// MFA service for challenge token validation.
	/// </param>
	/// <param name="attemptTracker">
	/// Per-user attempt tracker for brute-force protection.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// AuthResult with tokens on success, error on failure.
	/// </returns>
	public static async Task<AuthResult> HandleAsync(
		VerifyTotpCodeCommand command,
		ITotpService totpService,
		TotpSecretProtector totpSecretProtector,
		UserManager<ApplicationUser> userManager,
		AuthenticationService authenticationService,
		ISecurityAuditService securityAuditService,
		ITrustedDeviceService trustedDeviceService,
		IMfaService mfaService,
		IMfaAttemptTracker attemptTracker,
		CancellationToken cancellationToken)
	{
		(ApplicationUser? user, AuthResult? challengeError) =
			await ValidateChallengeAndGetUserAsync(
				mfaService,
				userManager,
				command.Request.ChallengeToken,
				cancellationToken);

		if (challengeError is not null)
		{
			return challengeError;
		}

		if (attemptTracker.IsLockedOut(
			user!.Id,
			MfaAttemptTypes.Totp))
		{
			await securityAuditService.LogEventAsync(
				SecurityEventType.MfaFailed,
				user,
				success: false,
				details: "TOTP locked out — too many attempts",
				cancellationToken);

			return AuthResult.Failed(
				AuthErrorMessages.TooManyAttempts,
				MfaErrorCodes.TooManyAttempts);
		}

		if (string.IsNullOrEmpty(user.TotpSecret))
		{
			await securityAuditService.LogEventAsync(
				SecurityEventType.MfaFailed,
				user,
				success: false,
				details: "TOTP not enrolled",
				cancellationToken);

			return AuthResult.Failed(
				"TOTP is not configured for this account",
				MfaErrorCodes.TotpNotConfigured);
		}

		bool isValidCode =
			totpService.VerifyCode(
				totpSecretProtector.Unprotect(user.TotpSecret),
				command.Request.Code);

		if (!isValidCode)
		{
			attemptTracker.RecordFailedAttempt(user.Id, MfaAttemptTypes.Totp);

			await securityAuditService.LogEventAsync(
				SecurityEventType.MfaFailed,
				user,
				success: false,
				details: "TOTP invalid code",
				cancellationToken);

			return AuthResult.Failed(
				"Invalid verification code",
				MfaErrorCodes.InvalidCode);
		}

		attemptTracker.ResetAttempts(user.Id, MfaAttemptTypes.Totp);

		await mfaService.ConsumeChallengeAsync(
			command.Request.ChallengeToken,
			cancellationToken);

		await securityAuditService.LogEventAsync(
			SecurityEventType.MfaSuccess,
			user,
			success: true,
			details: "TOTP",
			cancellationToken);

		return await GenerateResultWithOptionalTrustAsync(
			user,
			(command.Request.TrustDevice, command.ClientIp, command.UserAgent),
			authenticationService,
			trustedDeviceService,
			cancellationToken);
	}

	/// <summary>
	/// Validates the MFA challenge token and retrieves the associated user.
	/// </summary>
	private static async Task<(ApplicationUser? User, AuthResult? Error)>
		ValidateChallengeAndGetUserAsync(
			IMfaService mfaService,
			UserManager<ApplicationUser> userManager,
			string challengeToken,
			CancellationToken cancellationToken)
	{
		MfaChallengeValidationResult challengeValidation =
			await mfaService.ValidateChallengeTokenAsync(
				challengeToken,
				cancellationToken);

		if (!challengeValidation.Success)
		{
			AuthResult challengeError =
				AuthResult.Failed(
					challengeValidation.Error!,
					challengeValidation.ErrorCode);

			return (null, challengeError);
		}

		ApplicationUser? user =
			await userManager.FindByIdAsync(
				challengeValidation.UserId.ToString());

		if (!user.IsValidForAuthentication())
		{
			AuthResult invalidError =
				AuthResult.Failed(
					AuthErrorMessages.InvalidCredentials,
					AuthErrorCodes.InvalidCredentials);

			return (null, invalidError);
		}

		return (user, null);
	}

	/// <summary>
	/// Generates the auth result, optionally adding a trusted device token.
	/// </summary>
	private static async Task<AuthResult> GenerateResultWithOptionalTrustAsync(
		ApplicationUser user,
		(bool TrustDevice, string? ClientIp, string? UserAgent) deviceDetails,
		AuthenticationService authenticationService,
		ITrustedDeviceService trustedDeviceService,
		CancellationToken cancellationToken)
	{
		AuthResult authResult =
			await authenticationService.GenerateAuthResultAsync(
				user,
				deviceDetails.ClientIp,
				user.RequiresPasswordChange,
				rememberMe: false,
				cancellationToken);

		if (deviceDetails.TrustDevice)
		{
			string deviceToken =
				await trustedDeviceService.CreateTrustedDeviceAsync(
					user.Id,
					deviceDetails.UserAgent ?? string.Empty,
					deviceDetails.ClientIp,
					cancellationToken);

			return authResult with { TrustedDeviceToken = deviceToken };
		}

		return authResult;
	}
}