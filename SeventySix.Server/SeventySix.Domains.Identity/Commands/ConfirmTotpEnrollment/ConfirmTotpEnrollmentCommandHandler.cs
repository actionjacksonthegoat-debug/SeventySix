// <copyright file="ConfirmTotpEnrollmentCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SeventySix.Shared.Interfaces;
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
	/// <param name="totpSecretProtector">
	/// Data protector for TOTP secrets.
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
	/// <param name="transactionManager">
	/// Transaction manager for concurrency-safe read-then-write operations.
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
		ITransactionManager transactionManager,
		CancellationToken cancellationToken)
	{
		// Closure variables for results passed out of the transaction lambda
		SecurityEventType? pendingAuditType = null;
		bool pendingAuditSuccess = false;
		string? pendingAuditDetails = null;
		ApplicationUser? pendingAuditUser = null;
		Result? earlyResult = null;

		await transactionManager.ExecuteInTransactionAsync(
			async ct =>
			{
				// Reset closure state for retries
				pendingAuditType = null;
				pendingAuditUser = null;
				earlyResult = null;

				ApplicationUser? user =
					await userManager.FindByIdAsync(command.UserId.ToString());

				if (!user.IsValidForAuthentication())
				{
					earlyResult =
						Result.Failure(AuthErrorMessages.InvalidCredentials);
					return;
				}

				if (string.IsNullOrEmpty(user.TotpSecret))
				{
					earlyResult =
						Result.Failure("TOTP enrollment not initiated");
					return;
				}

				if (user.TotpEnrolledAt.HasValue)
				{
					earlyResult =
						Result.Failure("TOTP is already confirmed");
					return;
				}

				bool isValidCode =
					totpService.VerifyCode(
						totpSecretProtector.Unprotect(user.TotpSecret),
						command.Request.Code);

				if (!isValidCode)
				{
					pendingAuditType =
						SecurityEventType.MfaFailed;
					pendingAuditSuccess = false;
					pendingAuditDetails = "TOTP enrollment confirmation failed";
					pendingAuditUser = user;
					earlyResult =
						Result.Failure("Invalid verification code");
					return;
				}

				// Confirm enrollment
				user.TotpEnrolledAt =
					timeProvider.GetUtcNow();
				user.MfaEnabled = true;
				pendingAuditUser = user;

				IdentityResult updateResult =
					await userManager.UpdateAsync(user);

				if (!updateResult.Succeeded)
				{
					if (updateResult.Errors.Any(
						error => error.Code == "ConcurrencyFailure"))
					{
						throw new DbUpdateConcurrencyException(
							"Concurrency conflict updating TOTP enrollment. Will retry.");
					}

					earlyResult =
						Result.Failure("Failed to confirm TOTP enrollment");
					return;
				}

				pendingAuditType =
					SecurityEventType.TotpEnrolled;
				pendingAuditSuccess = true;
			},
			cancellationToken: cancellationToken);

		// Audit log outside transaction (cannot roll back telemetry)
		if (pendingAuditType is not null && pendingAuditUser is not null)
		{
			await securityAuditService.LogEventAsync(
				pendingAuditType.Value,
				pendingAuditUser,
				success: pendingAuditSuccess,
				details: pendingAuditDetails,
				cancellationToken);
		}

		if (earlyResult is not null)
		{
			return earlyResult;
		}

		return Result.Success();
	}
}