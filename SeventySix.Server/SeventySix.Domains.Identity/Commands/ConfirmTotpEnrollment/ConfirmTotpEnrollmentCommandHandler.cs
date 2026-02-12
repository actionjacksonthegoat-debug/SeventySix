// <copyright file="ConfirmTotpEnrollmentCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using SeventySix.Shared.POCOs;

namespace SeventySix.Identity;

/// <summary>
/// Handler for TOTP enrollment confirmation command.
/// </summary>
public static class ConfirmTotpEnrollmentCommandHandler
{
	/// <summary>
	/// Confirms TOTP enrollment by verifying a code from the authenticator app.
	/// </summary>
	/// <param name="command">
	/// The confirmation command.
	/// </param>
	/// <param name="totpService">
	/// TOTP service for code verification.
	/// </param>
	/// <param name="userManager">
	/// Identity UserManager for user lookup and update.
	/// </param>
	/// <param name="securityAuditService">
	/// Security audit logging service.
	/// </param>
	/// <param name="timeProvider">
	/// Time provider for timestamps.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Result indicating success or failure.
	/// </returns>
	public static async Task<Result> HandleAsync(
		ConfirmTotpEnrollmentCommand command,
		ITotpService totpService,
		TotpSecretProtector totpSecretProtector,
		UserManager<ApplicationUser> userManager,
		ISecurityAuditService securityAuditService,
		TimeProvider timeProvider,
		CancellationToken cancellationToken)
	{
		ApplicationUser? user =
			await userManager.FindByIdAsync(command.UserId.ToString());

		if (!user.IsValidForAuthentication())
		{
			return Result.Failure(AuthErrorMessages.InvalidCredentials);
		}

		if (string.IsNullOrEmpty(user.TotpSecret))
		{
			return Result.Failure("TOTP enrollment not initiated");
		}

		if (user.TotpEnrolledAt.HasValue)
		{
			return Result.Failure("TOTP is already confirmed");
		}

		bool isValidCode =
			totpService.VerifyCode(
				totpSecretProtector.Unprotect(user.TotpSecret),
				command.Request.Code);

		if (!isValidCode)
		{
			await securityAuditService.LogEventAsync(
				SecurityEventType.MfaFailed,
				user,
				success: false,
				details: "TOTP enrollment confirmation failed",
				cancellationToken);

			return Result.Failure("Invalid verification code");
		}

		// Confirm enrollment
		user.TotpEnrolledAt =
			timeProvider.GetUtcNow().UtcDateTime;
		user.MfaEnabled = true;

		IdentityResult updateResult =
			await userManager.UpdateAsync(user);

		if (!updateResult.Succeeded)
		{
			return Result.Failure("Failed to confirm TOTP enrollment");
		}

		await securityAuditService.LogEventAsync(
			SecurityEventType.TotpEnrolled,
			user,
			success: true,
			details: null,
			cancellationToken);

		return Result.Success();
	}
}