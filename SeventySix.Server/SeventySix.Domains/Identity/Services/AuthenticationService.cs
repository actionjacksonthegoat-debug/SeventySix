// <copyright file="AuthenticationService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
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
/// <param name="userRepository">
/// Repository for user queries and role lookups.
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
public sealed class AuthenticationService(
	IAuthRepository authRepository,
	IUserQueryRepository userRepository,
	ITokenService tokenService,
	IOptions<JwtSettings> jwtSettings,
	TimeProvider timeProvider)
{
	/// <summary>
	/// Generates authentication result with access and refresh tokens.
	/// </summary>
	/// <param name="user">
	/// The user instance for whom tokens are issued.
	/// </param>
	/// <param name="clientIp">
	/// The client's IP address (optional).
	/// </param>
	/// <param name="requiresPasswordChange">
	/// Whether the user must change their password after login.
	/// </param>
	/// <param name="rememberMe">
	/// Whether to issue a long-lived refresh token.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// An AuthResult containing access and refresh tokens with expiration information,
	/// or a failure result explaining why authentication failed.
	/// </returns>
	/// <remarks>
	/// Handles role loading, token generation, expiration calculation,
	/// and last login tracking in a single cohesive operation.
	/// </remarks>
	public async Task<AuthResult> GenerateAuthResultAsync(
		User user,
		string? clientIp,
		bool requiresPasswordChange,
		bool rememberMe,
		CancellationToken cancellationToken)
	{
		IEnumerable<string> roles =
			await userRepository.GetUserRolesAsync(
				user.Id,
				cancellationToken);

		string accessToken =
			tokenService.GenerateAccessToken(
				user.Id,
				user.Username,
				roles.ToList());

		string refreshToken =
			await tokenService.GenerateRefreshTokenAsync(
				user.Id,
				clientIp,
				rememberMe,
				cancellationToken);

		DateTime expiresAt =
			timeProvider
			.GetUtcNow()
			.AddMinutes(jwtSettings.Value.AccessTokenExpirationMinutes)
			.UtcDateTime;

		await authRepository.UpdateLastLoginAsync(
			user.Id,
			timeProvider.GetUtcNow().UtcDateTime,
			clientIp,
			cancellationToken);

		return AuthResult.Succeeded(
			accessToken,
			refreshToken,
			expiresAt,
			user.Email,
			user.FullName,
			requiresPasswordChange);
	}
}