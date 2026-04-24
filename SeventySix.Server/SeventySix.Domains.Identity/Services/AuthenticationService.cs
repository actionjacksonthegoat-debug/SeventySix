// <copyright file="AuthenticationService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Service for handling authentication token operations.
/// </summary>
/// <remarks>
/// Encapsulates authentication workflows including token generation,
/// role loading, and last login tracking.
/// Extracted from command handlers to reduce parameter coupling
/// and eliminate code duplication across the authentication surface.
/// </remarks>
/// <param name="authRepository">
/// Repository for authentication persistence and token updates.
/// </param>
/// <param name="tokenService">
/// Token service responsible for access/refresh token generation.
/// </param>
/// <param name="timeProvider">
/// Time provider for obtaining current UTC times.
/// </param>
/// <param name="userManager">
/// ASP.NET Core Identity UserManager for role lookups and role operations.
/// </param>
public sealed class AuthenticationService(
	IAuthRepository authRepository,
	ITokenService tokenService,
	TimeProvider timeProvider,
	UserManager<ApplicationUser> userManager)
	: IAuthenticationService
{
	/// <inheritdoc/>
	public async Task<AuthResult> GenerateAuthResultAsync(
		ApplicationUser user,
		bool requiresPasswordChange,
		bool rememberMe,
		CancellationToken cancellationToken)
	{
		if (string.IsNullOrWhiteSpace(user.Email))
		{
			throw new InvalidOperationException(
				$"Identity user {user.Id} is missing required email for authentication.");
		}

		// Detect first login BEFORE updating LastLoginAt
		bool isFirstLogin =
			user.LastLoginAt is null;

		IList<string> roles =
			await userManager.GetRolesAsync(user);

		IssuedAccessToken issuedToken =
			tokenService.IssueAccessToken(
				user.Id,
				user.UserName ?? string.Empty,
				roles,
				requiresPasswordChange);

		string refreshToken =
			await tokenService.GenerateRefreshTokenAsync(
				user.Id,
				rememberMe,
				cancellationToken);

		await authRepository.UpdateLastLoginAsync(
			user.Id,
			timeProvider.GetUtcNow(),
			cancellationToken);

		return AuthResult.Succeeded(
			issuedToken.Token,
			refreshToken,
			issuedToken.ExpiresAt,
			user.Email,
			user.FullName,
			requiresPasswordChange,
			rememberMe,
			isFirstLogin);
	}
}