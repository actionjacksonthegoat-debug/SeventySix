// <copyright file="DisableTotpCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using SeventySix.Shared.POCOs;

namespace SeventySix.Identity;

/// <summary>
/// Handler for TOTP disable command.
/// </summary>
public static class DisableTotpCommandHandler
{
	/// <summary>
	/// Disables TOTP authentication after verifying password.
	/// </summary>
	/// <param name="command">
	/// The disable command.
	/// </param>
	/// <param name="userManager">
	/// Identity UserManager for user lookup and update.
	/// </param>
	/// <param name="securityAuditService">
	/// Security audit logging service.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Result indicating success or failure.
	/// </returns>
	public static async Task<Result> HandleAsync(
		DisableTotpCommand command,
		UserManager<ApplicationUser> userManager,
		ISecurityAuditService securityAuditService,
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
			return Result.Failure("TOTP is not configured for this account");
		}

		// Verify password
		bool passwordValid =
			await userManager.CheckPasswordAsync(
				user,
				command.Request.Password);

		if (!passwordValid)
		{
			await securityAuditService.LogEventAsync(
				SecurityEventType.MfaFailed,
				user,
				success: false,
				details: "TOTP disable - invalid password",
				cancellationToken);

			return Result.Failure("Invalid password");
		}

		// Clear TOTP settings and disable per-user MFA
		// (TOTP enrollment is the only path that enables per-user MFA)
		user.TotpSecret = null;
		user.TotpEnrolledAt = null;
		user.MfaEnabled = false;

		IdentityResult updateResult =
			await userManager.UpdateAsync(user);

		if (!updateResult.Succeeded)
		{
			return Result.Failure("Failed to disable TOTP");
		}

		await securityAuditService.LogEventAsync(
			SecurityEventType.TotpDisabled,
			user,
			success: true,
			details: null,
			cancellationToken);

		return Result.Success();
	}
}