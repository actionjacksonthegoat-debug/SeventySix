// <copyright file="TokenService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Shared.Extensions;

namespace SeventySix.Identity;

/// <summary>
/// Facade that delegates to focused token services while maintaining backward compatibility.
/// </summary>
/// <remarks>
/// Delegates to:
/// - <see cref="ITokenGenerationService"/> for JWT and refresh token creation
/// - <see cref="ITokenRevocationService"/> for token revocation
/// Handles token rotation orchestration and validation directly.
/// </remarks>
public sealed class TokenService(
	ITokenGenerationService tokenGenerationService,
	ITokenRevocationService tokenRevocationService,
	ITokenRepository tokenRepository,
	IOptions<JwtSettings> jwtSettings,
	IOptions<AuthSettings> authSettings,
	ILogger<TokenService> logger,
	TimeProvider timeProvider) : ITokenService
{
	/// <inheritdoc/>
	public string GenerateAccessToken(
		long userId,
		string username,
		IEnumerable<string> roles,
		bool requiresPasswordChange = false) =>
		tokenGenerationService.GenerateAccessToken(
			userId,
			username,
			roles,
			requiresPasswordChange);

	/// <inheritdoc/>
	public async Task<string> GenerateRefreshTokenAsync(
		long userId,
		bool rememberMe = false,
		CancellationToken cancellationToken = default) =>
		await tokenGenerationService.GenerateRefreshTokenAsync(
			userId,
			rememberMe,
			cancellationToken);


	/// <inheritdoc/>
	public async Task<(string? Token, bool RememberMe)> RotateRefreshTokenAsync(
		string refreshToken,
		CancellationToken cancellationToken = default)
	{
		string tokenHash =
			CryptoExtensions.ComputeSha256Hash(refreshToken);

		DateTimeOffset now =
			timeProvider.GetUtcNow();

		// Find the token (including revoked ones for reuse detection)
		RefreshToken? existingToken =
			await tokenRepository.GetByTokenHashAsync(
				tokenHash,
				cancellationToken);

		// Token not found
		if (existingToken == null)
		{
			return (null, false);
		}

		// Token expired
		if (existingToken.ExpiresAt <= now)
		{
			return (null, false);
		}

		// Check absolute session timeout (30 days from session start)
		DateTimeOffset absoluteTimeout =
			existingToken.SessionStartedAt.AddDays(
				jwtSettings.Value.AbsoluteSessionTimeoutDays);

		if (now >= absoluteTimeout)
		{
			logger.LogWarning(
				"Absolute session timeout reached for user {UserId}. Session started: {SessionStartedAt}",
				existingToken.UserId,
				existingToken.SessionStartedAt);

			// Revoke this token
			await tokenRepository.RevokeAsync(
				existingToken,
				now,
				cancellationToken);

			return (null, false);
		}

		// REUSE ATTACK DETECTED: Token already revoked but attacker trying to use it
		// When DisableRotation is enabled (E2E testing), skip this check since tokens aren't revoked
		if (existingToken.IsRevoked && !authSettings.Value.Token.DisableRotation)
		{
			logger.LogWarning(
				"Token reuse attack detected for user {UserId}, revoking family {FamilyId}",
				existingToken.UserId,
				existingToken.FamilyId);

			// Revoke entire token family - this invalidates the legitimate user's token too
			await tokenRepository.RevokeFamilyAsync(
				existingToken.FamilyId,
				now,
				cancellationToken);

			return (null, false);
		}

		// Calculate rememberMe from token expiration to preserve original setting
		int tokenLifetimeDays =
			(int)
			(
				existingToken.ExpiresAt - existingToken.SessionStartedAt).TotalDays;

		bool rememberMe =
			tokenLifetimeDays > jwtSettings.Value.RefreshTokenExpirationDays;

		// Valid rotation - revoke current token (unless disabled for E2E testing)
		if (!authSettings.Value.Token.DisableRotation)
		{
			await tokenRepository.RevokeAsync(
				existingToken,
				now,
				cancellationToken);
		}

		// Generate new token inheriting the family and session start
		string newToken =
			await tokenGenerationService.GenerateRefreshTokenWithFamilyAsync(
				existingToken.UserId,
				rememberMe,
				existingToken.FamilyId,
				existingToken.SessionStartedAt,
				cancellationToken);

		return (newToken, rememberMe);
	}

	/// <inheritdoc/>
	public async Task<long?> ValidateRefreshTokenAsync(
		string refreshToken,
		CancellationToken cancellationToken = default)
	{
		string tokenHash =
			CryptoExtensions.ComputeSha256Hash(refreshToken);

		DateTimeOffset now =
			timeProvider.GetUtcNow();

		return await tokenRepository.ValidateTokenAsync(
			tokenHash,
			now,
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> RevokeRefreshTokenAsync(
		string refreshToken,
		CancellationToken cancellationToken = default) =>
		await tokenRevocationService.RevokeRefreshTokenAsync(
			refreshToken,
			cancellationToken);

	/// <inheritdoc/>
	public async Task<int> RevokeAllUserTokensAsync(
		long userId,
		CancellationToken cancellationToken = default) =>
		await tokenRevocationService.RevokeAllUserTokensAsync(
			userId,
			cancellationToken);
}