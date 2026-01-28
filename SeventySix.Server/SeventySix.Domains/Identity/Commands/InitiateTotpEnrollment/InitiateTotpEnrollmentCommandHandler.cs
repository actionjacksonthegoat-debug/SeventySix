// <copyright file="InitiateTotpEnrollmentCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Handler for TOTP enrollment initiation command.
/// </summary>
public static class InitiateTotpEnrollmentCommandHandler
{
	/// <summary>
	/// Initiates TOTP enrollment by generating a secret and setup URI.
	/// </summary>
	/// <param name="command">
	/// The enrollment command.
	/// </param>
	/// <param name="totpService">
	/// TOTP service for secret generation.
	/// </param>
	/// <param name="userManager">
	/// Identity UserManager for user lookup.
	/// </param>
	/// <param name="securityAuditService">
	/// Security audit logging service.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// TotpSetupResult with secret and QR code URI on success.
	/// </returns>
	public static async Task<TotpSetupResult> HandleAsync(
		InitiateTotpEnrollmentCommand command,
		ITotpService totpService,
		UserManager<ApplicationUser> userManager,
		ISecurityAuditService securityAuditService,
		CancellationToken cancellationToken)
	{
		ApplicationUser? user =
			await userManager.FindByIdAsync(command.UserId.ToString());

		if (!user.IsValidForAuthentication())
		{
			return TotpSetupResult.Failed(
				AuthErrorMessages.InvalidCredentials,
				AuthErrorCodes.InvalidCredentials);
		}

		if (!string.IsNullOrEmpty(user.TotpSecret) && user.TotpEnrolledAt.HasValue)
		{
			return TotpSetupResult.Failed(
				"TOTP is already configured for this account",
				MfaErrorCodes.TotpAlreadyConfigured);
		}

		string secret =
			totpService.GenerateSecret();

		string qrCodeUri =
			totpService.GenerateSetupUri(
				secret,
				user.Email!);

		// Store pending secret (not confirmed yet)
		user.TotpSecret = secret;
		user.TotpEnrolledAt = null;

		IdentityResult updateResult =
			await userManager.UpdateAsync(user);

		if (!updateResult.Succeeded)
		{
			return TotpSetupResult.Failed(
				"Failed to initiate TOTP enrollment",
				AuthErrorCodes.InvalidCredentials);
		}

		await securityAuditService.LogEventAsync(
			SecurityEventType.TotpEnrollmentInitiated,
			user,
			success: true,
			details: null,
			cancellationToken);

		return TotpSetupResult.Succeeded(
			secret,
			qrCodeUri);
	}
}