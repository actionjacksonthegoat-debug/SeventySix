// <copyright file="RefreshTokensCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Handler for refresh tokens command.
/// </summary>
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
		CancellationToken cancellationToken)
	{
		long? userId =
			await tokenService.ValidateRefreshTokenAsync(
				command.RefreshToken,
				cancellationToken);

		if (userId == null)
		{
			return AuthResult.Failed(
				"Invalid or expired refresh token.",
				AuthErrorCodes.InvalidToken);
		}

		ApplicationUser? user =
			await userManager.FindByIdAsync(userId.Value.ToString());

		if (user == null || !user.IsActive)
		{
			return AuthResult.Failed(
				"User account is no longer valid.",
				AuthErrorCodes.AccountInactive);
		}

		string? newRefreshToken =
			await tokenService.RotateRefreshTokenAsync(
				command.RefreshToken,
				command.ClientIp,
				cancellationToken);

		if (newRefreshToken == null)
		{
			return AuthResult.Failed(
				"Token has already been used. Please login again.",
				AuthErrorCodes.TokenReuse);
		}

		// Check if user has a password set to determine if password change is required
		bool hasPassword =
			await userManager.HasPasswordAsync(user);

		bool requiresPasswordChange = !hasPassword;

		// Generate new tokens using authentication service
		// Note: We replace the refresh token with the rotated one
		AuthResult result =
			await authenticationService.GenerateAuthResultAsync(
				user,
				command.ClientIp,
				requiresPasswordChange,
				rememberMe: false, // Refresh doesn't change remember-me preference
				cancellationToken);

		// Replace with rotated refresh token
		return AuthResult.Succeeded(
			result.AccessToken!,
			newRefreshToken,
			result.ExpiresAt!.Value,
			result.Email!,
			result.FullName,
			requiresPasswordChange);
	}
}