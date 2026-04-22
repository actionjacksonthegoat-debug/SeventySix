// <copyright file="AuthenticationService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace SeventySix.Identity;

/// <summary>
/// Service for handling authentication token operations.
/// </summary>
/// <remarks>
/// Encapsulates authentication workflows including token generation,
/// role loading, and last login tracking.
/// Extracted from LoginCommandHandler and RefreshTokensCommandHandler
/// to reduce parameter coupling and eliminate code duplication.
/// </remarks>
/// <param name="authRepository">
/// Repository for authentication persistence and token updates.
/// </param>
/// <param name="tokenService">
/// Token service responsible for access/refresh token generation.
/// </param>
/// <param name="jwtSettings">
/// JWT configuration values (expiration minutes, keys).
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
	IOptions<JwtSettings> jwtSettings,
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
		// Detect first login BEFORE updating LastLoginAt
		bool isFirstLogin =
			user.LastLoginAt is null;

		AuthResult accessTokenResult =
			await GenerateAccessTokenResultAsync(
				user,
				requiresPasswordChange,
				rememberMe,
				cancellationToken);

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
			accessTokenResult.AccessToken!,
			refreshToken,
			accessTokenResult.ExpiresAt!.Value,
			accessTokenResult.Email!,
			accessTokenResult.FullName,
			requiresPasswordChange,
			rememberMe,
			isFirstLogin);
	}

	/// <inheritdoc/>
	public async Task<AuthResult> GenerateAccessTokenResultAsync(
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

		IList<string> roles =
			await userManager.GetRolesAsync(user);

		string accessToken =
			tokenService.GenerateAccessToken(
				user.Id,
				user.UserName ?? string.Empty,
				[.. roles],
				requiresPasswordChange);

		DateTimeOffset expiresAt =
			timeProvider.GetUtcNow()
				.AddMinutes(jwtSettings.Value.AccessTokenExpirationMinutes);

		return AuthResult.Succeeded(
			accessToken,
			refreshToken: string.Empty,
			expiresAt,
			user.Email,
			user.FullName,
			requiresPasswordChange,
			rememberMe);
	}
}