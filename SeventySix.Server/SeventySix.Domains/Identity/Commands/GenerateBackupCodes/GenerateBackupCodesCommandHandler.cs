// <copyright file="GenerateBackupCodesCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Handler for generating backup codes command.
/// </summary>
public static class GenerateBackupCodesCommandHandler
{
	/// <summary>
	/// Generates new backup codes for a user.
	/// </summary>
	/// <param name="command">
	/// The generate command.
	/// </param>
	/// <param name="backupCodeService">
	/// Backup code service for code generation.
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
	/// BackupCodesResult with generated codes on success.
	/// </returns>
	public static async Task<BackupCodesResult> HandleAsync(
		GenerateBackupCodesCommand command,
		IBackupCodeService backupCodeService,
		UserManager<ApplicationUser> userManager,
		ISecurityAuditService securityAuditService,
		CancellationToken cancellationToken)
	{
		ApplicationUser? user =
			await userManager.FindByIdAsync(command.UserId.ToString());

		if (user is null || !user.IsActive)
		{
			return BackupCodesResult.Failed(
				AuthErrorMessages.InvalidCredentials,
				AuthErrorCodes.InvalidCredentials);
		}

		IReadOnlyList<string> codes =
			await backupCodeService.GenerateCodesAsync(
				user.Id,
				cancellationToken);

		await securityAuditService.LogEventAsync(
			SecurityEventType.BackupCodesRegenerated,
			user,
			success: true,
			details: $"{codes.Count} codes generated",
			cancellationToken);

		return BackupCodesResult.Succeeded(codes);
	}
}