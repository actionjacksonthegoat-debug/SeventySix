// <copyright file="RefreshTokensCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Handler for refresh tokens command.
/// </summary>
/// <remarks>
/// Rotates refresh tokens following security best practices and logs audit events.
/// </remarks>
public static class RefreshTokensCommandHandler
{
	/// <summary>
	/// Handles refresh tokens command.
	/// </summary>
	/// <param name="command">
	/// The refresh tokens command containing the refresh token and client IP.
	/// </param>
	/// <param name="tokenService">
	/// Service for validating and rotating refresh tokens.
	/// </param>
	/// <param name="userManager">
	/// Identity <see cref="UserManager{TUser}"/> for user lookups.
	/// </param>
	/// <param name="authenticationService">
	/// Service to generate new authentication results.
	/// </param>
	/// <param name="securityAuditService">
	/// Service for logging security audit events.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// An <see cref="AuthResult"/> with rotated refresh token and access token on success.
	/// </returns>
	public static async Task<AuthResult> HandleAsync(
		RefreshTokensCommand command,
		ITokenService tokenService,
		UserManager<ApplicationUser> userManager,
		AuthenticationService authenticationService,
		ISecurityAuditService securityAuditService,
		CancellationToken cancellationToken)
	{
		long? userId =
			await tokenService.ValidateRefreshTokenAsync(
				command.RefreshToken,
				cancellationToken);

		if (userId == null)
		{
			// Log invalid token attempt without user context
			await securityAuditService.LogEventAsync(
				SecurityEventType.LoginFailed,
				userId: null,
				username: null,
				success: false,
				details: "Invalid or expired refresh token",
				cancellationToken);

			return AuthResult.Failed(
				"Invalid or expired refresh token.",
				AuthErrorCodes.InvalidToken);
		}

		ApplicationUser? user =
			await userManager.FindByIdAsync(
				userId.Value.ToString());

		if (user == null || !user.IsActive)
		{
			await securityAuditService.LogEventAsync(
				SecurityEventType.LoginFailed,
				userId,
				username: null,
				success: false,
				details: user is null ? "User not found during token refresh" : "User inactive during token refresh",
				cancellationToken);

			return AuthResult.Failed(
				"User account is no longer valid.",
				AuthErrorCodes.AccountInactive);
		}

		(string? newRefreshToken, bool rememberMe) =
			await tokenService.RotateRefreshTokenAsync(
				command.RefreshToken,
				command.ClientIp,
				cancellationToken);

		if (newRefreshToken == null)
		{
			// Token reuse detected - critical security event
			await securityAuditService.LogEventAsync(
				SecurityEventType.TokenReuseDetected,
				user,
				success: false,
				details: "Refresh token reuse attempt detected",
				cancellationToken);

			return AuthResult.Failed(
				"Token has already been used. Please login again.",
				AuthErrorCodes.TokenReuse);
		}

		// Use the database flag as the single source of truth
		bool requiresPasswordChange =
			user.RequiresPasswordChange;

		// Generate access token only — no orphaned refresh token created
		AuthResult accessTokenResult =
			await authenticationService.GenerateAccessTokenResultAsync(
				user,
				requiresPasswordChange,
				rememberMe,
				cancellationToken);

		// Log successful token refresh
		await securityAuditService.LogEventAsync(
			SecurityEventType.TokenRefreshed,
			user,
			success: true,
			details: null,
			cancellationToken);

		// Replace with rotated refresh token
		return AuthResult.Succeeded(
			accessTokenResult.AccessToken!,
			newRefreshToken,
			accessTokenResult.ExpiresAt!.Value,
			accessTokenResult.Email!,
			accessTokenResult.FullName,
			requiresPasswordChange,
			rememberMe);
	}
}