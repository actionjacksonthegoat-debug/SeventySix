// <copyright file="VerifyBackupCodeCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Handler for backup code verification command.
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
		CancellationToken cancellationToken)
	{
		ApplicationUser? user =
			await userManager.FindByEmailAsync(command.Request.Email);

		if (!user.IsValidForAuthentication())
		{
			return AuthResult.Failed(
				AuthErrorMessages.InvalidCredentials,
				AuthErrorCodes.InvalidCredentials);
		}

		bool isValidCode =
			await backupCodeService.VerifyAndConsumeCodeAsync(
				user.Id,
				command.Request.Code,
				cancellationToken);

		if (!isValidCode)
		{
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

		int remainingCodes =
			await backupCodeService.GetRemainingCountAsync(
				user.Id,
				cancellationToken);

		await securityAuditService.LogEventAsync(
			SecurityEventType.MfaSuccess,
			user,
			success: true,
			details: $"Backup code used, {remainingCodes} remaining",
			cancellationToken);

		return await authenticationService.GenerateAuthResultAsync(
			user,
			command.ClientIp,
			user.RequiresPasswordChange,
			rememberMe: false,
			cancellationToken);
	}
}