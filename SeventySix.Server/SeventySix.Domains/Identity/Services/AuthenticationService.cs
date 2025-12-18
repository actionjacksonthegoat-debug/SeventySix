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