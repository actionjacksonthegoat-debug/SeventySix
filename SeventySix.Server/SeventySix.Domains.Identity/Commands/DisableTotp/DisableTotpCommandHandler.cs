// <copyright file="DisableTotpCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SeventySix.Shared.Interfaces;
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
		DisableTotpCommand command,
		UserManager<ApplicationUser> userManager,
		ISecurityAuditService securityAuditService,
		ITransactionManager transactionManager,
		CancellationToken cancellationToken)
	{
		// Closure state — reset at transaction start to handle retries correctly
		SecurityEventType? pendingAuditType = null;
		bool pendingAuditSuccess = false;
		string? pendingAuditDetails = null;
		ApplicationUser? pendingAuditUser = null;
		Result? earlyResult = null;

		await transactionManager.ExecuteInTransactionAsync(
			async ct =>
			{
				// Reset closure state on each attempt to support retries
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
						Result.Failure("TOTP is not configured for this account");

					return;
				}

				pendingAuditUser = user;

				// Password verification (read-only — kept inside to avoid double FindByIdAsync)
				bool passwordValid =
					await userManager.CheckPasswordAsync(
						user,
						command.Request.Password);

				if (!passwordValid)
				{
					pendingAuditType =
						SecurityEventType.MfaFailed;
					pendingAuditSuccess = false;
					pendingAuditDetails =
						"TOTP disable - invalid password";
					earlyResult =
						Result.Failure("Invalid password");

					return;
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
					if (updateResult.Errors.Any(
						error => error.Code == "ConcurrencyFailure"))
					{
						throw new DbUpdateConcurrencyException(
							"Concurrency conflict disabling TOTP. Will retry.");
					}

					earlyResult =
						Result.Failure("Failed to disable TOTP");

					return;
				}

				pendingAuditType =
					SecurityEventType.TotpDisabled;
				pendingAuditSuccess = true;
			},
			cancellationToken: cancellationToken);

		// Run audit log outside transaction (after commit)
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