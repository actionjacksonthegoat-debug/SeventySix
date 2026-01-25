// <copyright file="LogoutCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.POCOs;

namespace SeventySix.Identity;

/// <summary>
/// Handler for logout command.
/// </summary>
/// <remarks>
/// Revokes refresh tokens and logs security audit events for compliance.
/// </remarks>
public static class LogoutCommandHandler
{
	/// <summary>
	/// Handles logout by revoking the refresh token.
	/// </summary>
	/// <param name="command">
	/// The logout command containing the refresh token.
	/// </param>
	/// <param name="tokenService">
	/// Token service.
	/// </param>
	/// <param name="securityAuditService">
	/// Service for logging security audit events.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A Result indicating success or failure with error details.
	/// </returns>
	public static async Task<Result> HandleAsync(
		LogoutCommand command,
		ITokenService tokenService,
		ISecurityAuditService securityAuditService,
		CancellationToken cancellationToken)
	{
		// Get userId from token before revoking (for audit logging)
		long? userId =
			await tokenService.ValidateRefreshTokenAsync(
				command.RefreshToken,
				cancellationToken);

		bool revoked =
			await tokenService.RevokeRefreshTokenAsync(
				command.RefreshToken,
				cancellationToken);

		if (revoked)
		{
			// Log successful logout with user context if available
			await securityAuditService.LogEventAsync(
				SecurityEventType.Logout,
				userId,
				username: null,
				success: true,
				details: null,
				cancellationToken);

			return Result.Success();
		}

		return Result.Failure("Token not found or already revoked");
	}
}