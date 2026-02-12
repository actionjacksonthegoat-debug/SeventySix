// <copyright file="VerifyBackupCodeCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Handler for backup code verification command.
/// Validates the MFA challenge token (proof of prior password authentication)
/// before verifying the backup code.
/// </summary>
public static class VerifyBackupCodeCommandHandler
{
	/// <summary>
	/// Handles backup code verification and issues tokens on success.
	/// </summary>
	/// <param name="command">
	/// The verification command.
	/// </param>
	/// <param name="backupCodeService">
	/// Backup code service for code validation.
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
		VerifyBackupCodeCommand command,
		IBackupCodeService backupCodeService,
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
			MfaAttemptTypes.BackupCode))
		{
			await securityAuditService.LogEventAsync(
				SecurityEventType.MfaFailed,
				user,
				success: false,
				details: "Backup code locked out — too many attempts",
				cancellationToken);

			return AuthResult.Failed(
				AuthErrorMessages.TooManyAttempts,
				MfaErrorCodes.TooManyAttempts);
		}

		bool isValidCode =
			await backupCodeService.VerifyAndConsumeCodeAsync(
				user.Id,
				command.Request.Code,
				cancellationToken);

		if (!isValidCode)
		{
			attemptTracker.RecordFailedAttempt(user.Id, MfaAttemptTypes.BackupCode);

			await securityAuditService.LogEventAsync(
				SecurityEventType.MfaFailed,
				user,
				success: false,
				details: "Invalid backup code",
				cancellationToken);

			return AuthResult.Failed(
				"Invalid or already used backup code",
				MfaErrorCodes.InvalidBackupCode);
		}

		attemptTracker.ResetAttempts(user.Id, MfaAttemptTypes.BackupCode);

		int remainingCodes =
			await backupCodeService.GetRemainingCountAsync(
				user.Id,
				cancellationToken);

		await mfaService.ConsumeChallengeAsync(
			command.Request.ChallengeToken,
			cancellationToken);

		await securityAuditService.LogEventAsync(
			SecurityEventType.MfaSuccess,
			user,
			success: true,
			details: $"Backup code used, {remainingCodes} remaining",
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