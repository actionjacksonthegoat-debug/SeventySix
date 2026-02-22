// <copyright file="VerifyMfaCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Handler for MFA verification command.
/// </summary>
public static class VerifyMfaCommandHandler
{
	/// <summary>
	/// Handles MFA verification and issues tokens on success.
	/// </summary>
	/// <param name="command">
	/// The verification command.
	/// </param>
	/// <param name="mfaService">
	/// MFA service for code validation.
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
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// AuthResult with tokens on success, error on failure.
	/// </returns>
	public static async Task<AuthResult> HandleAsync(
		VerifyMfaCommand command,
		IMfaService mfaService,
		UserManager<ApplicationUser> userManager,
		AuthenticationService authenticationService,
		ISecurityAuditService securityAuditService,
		ITrustedDeviceService trustedDeviceService,
		CancellationToken cancellationToken)
	{
		MfaVerificationResult verificationResult =
			await mfaService.VerifyCodeAsync(
				command.Request.ChallengeToken,
				command.Request.Code,
				cancellationToken);

		if (!verificationResult.Success)
		{
			await securityAuditService.LogEventAsync(
				SecurityEventType.MfaFailed,
				userId: verificationResult.UserId,
				username: null,
				success: false,
				details: verificationResult.ErrorCode,
				cancellationToken);

			return AuthResult.Failed(
				verificationResult.Error ?? "Invalid verification code",
				verificationResult.ErrorCode ?? MfaErrorCodes.InvalidCode);
		}

		ApplicationUser? user =
			await userManager.FindByIdAsync(
				verificationResult.UserId.ToString());

		if (!user.IsValidForAuthentication())
		{
			return AuthResult.Failed(
				AuthErrorMessages.InvalidCredentials,
				AuthErrorCodes.InvalidCredentials);
		}

		await securityAuditService.LogEventAsync(
			SecurityEventType.MfaSuccess,
			user,
			success: true,
			details: null,
			cancellationToken);

		AuthResult authResult =
			await authenticationService.GenerateAuthResultAsync(
				user,
				command.ClientIp,
				user.RequiresPasswordChange,
				rememberMe: false,
				cancellationToken);

		if (command.Request.TrustDevice)
		{
			string deviceToken =
				await trustedDeviceService.CreateTrustedDeviceAsync(
					user.Id,
					command.UserAgent ?? string.Empty,
					command.ClientIp,
					cancellationToken);

			return authResult with { TrustedDeviceToken = deviceToken };
		}

		return authResult;
	}
}