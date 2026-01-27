// <copyright file="VerifyTotpCodeCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Handler for TOTP code verification command.
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
	/// <param name="userManager">
	/// Identity UserManager for user lookup.
	/// </param>
	/// <param name="authenticationService">
	/// Service to generate auth tokens.
	/// </param>
	/// <param name="securityAuditService">
	/// Security audit logging service.
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
		UserManager<ApplicationUser> userManager,
		AuthenticationService authenticationService,
		ISecurityAuditService securityAuditService,
		CancellationToken cancellationToken)
	{
		ApplicationUser? user =
			await userManager.FindByEmailAsync(command.Request.Email);

		if (user is null || !user.IsActive)
		{
			return AuthResult.Failed(
				AuthErrorMessages.InvalidCredentials,
				AuthErrorCodes.InvalidCredentials);
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
				user.TotpSecret,
				command.Request.Code);

		if (!isValidCode)
		{
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

		await securityAuditService.LogEventAsync(
			SecurityEventType.MfaSuccess,
			user,
			success: true,
			details: "TOTP",
			cancellationToken);

		return await authenticationService.GenerateAuthResultAsync(
			user,
			command.ClientIp,
			user.RequiresPasswordChange,
			rememberMe: false,
			cancellationToken);
	}
}