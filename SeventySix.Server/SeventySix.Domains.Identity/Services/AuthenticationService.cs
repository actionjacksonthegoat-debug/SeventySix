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
/// <remarks>
/// Not sealed to allow unit testing with NSubstitute. Methods are virtual for mocking.
/// </remarks>
public class AuthenticationService(
	IAuthRepository authRepository,
	ITokenService tokenService,
	IOptions<JwtSettings> jwtSettings,
	TimeProvider timeProvider,
	UserManager<ApplicationUser> userManager)
{
	/// <summary>
	/// Generates authentication result with access and refresh tokens for Identity <see cref="ApplicationUser"/>.
	/// </summary>
	/// <param name="user">
	/// The identity user to issue tokens for.
	/// </param>
	/// <param name="clientIp">
	/// The client's IP address for auditing and token creation.
	/// </param>
	/// <param name="requiresPasswordChange">
	/// Whether the user must change password on next login.
	/// </param>
	/// <param name="rememberMe">
	/// If true, issues a long-lived refresh token.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// An <see cref="AuthResult"/> with tokens and metadata.
	/// </returns>
	public virtual async Task<AuthResult> GenerateAuthResultAsync(
		ApplicationUser user,
		string? clientIp,
		bool requiresPasswordChange,
		bool rememberMe,
		CancellationToken cancellationToken)
	{
		AuthResult accessTokenResult =
			await GenerateAccessTokenResultAsync(
				user,
				requiresPasswordChange,
				rememberMe,
				cancellationToken);

		string refreshToken =
			await tokenService.GenerateRefreshTokenAsync(
				user.Id,
				clientIp,
				rememberMe,
				cancellationToken);

		await authRepository.UpdateLastLoginAsync(
			user.Id,
			timeProvider.GetUtcNow(),
			clientIp,
			cancellationToken);

		return AuthResult.Succeeded(
			accessTokenResult.AccessToken!,
			refreshToken,
			accessTokenResult.ExpiresAt!.Value,
			accessTokenResult.Email!,
			accessTokenResult.FullName,
			requiresPasswordChange,
			rememberMe);
	}

	/// <summary>
	/// Generates only the access token and metadata for use during token rotation.
	/// Does NOT create a new refresh token — the caller provides the rotated token.
	/// </summary>
	/// <param name="user">
	/// The identity user to issue an access token for.
	/// </param>
	/// <param name="requiresPasswordChange">
	/// Whether the user must change password on next login.
	/// </param>
	/// <param name="rememberMe">
	/// Whether the user's session uses extended expiration.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// An <see cref="AuthResult"/> with access token and metadata (RefreshToken is empty).
	/// </returns>
	public virtual async Task<AuthResult> GenerateAccessTokenResultAsync(
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
			timeProvider
			.GetUtcNow()
			.AddMinutes(jwtSettings.Value.AccessTokenExpirationMinutes)
			.UtcDateTime;

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