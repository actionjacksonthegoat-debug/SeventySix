// <copyright file="TokenService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SeventySix.Shared.Extensions;

namespace SeventySix.Identity;

/// <summary>
/// JWT and refresh token generation and validation service.
/// </summary>
/// <remarks>
/// Design Principles:
/// - Access tokens are JWTs with short expiration (configurable)
/// - Refresh tokens are random bytes, SHA256 hashed before storage
/// - Token rotation: old refresh token revoked when new one issued
/// - Session limits: oldest token revoked when max sessions exceeded
/// - PII (email, fullName) is NOT included in JWT for GDPR compliance
/// </remarks>
public class TokenService(
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
		IEnumerable<string> roles)
	{
		List<Claim> claims =
			[
				new Claim(
					JwtRegisteredClaimNames.Sub,
					userId.ToString()),
				new Claim(
					JwtRegisteredClaimNames.UniqueName,
					username),
				new Claim(
					JwtRegisteredClaimNames.Jti,
					Guid.NewGuid().ToString()),
				new Claim(
					JwtRegisteredClaimNames.Iat,
					timeProvider.GetUtcNow().ToUnixTimeSeconds().ToString(),
					ClaimValueTypes.Integer64),
			];

		// Add role claims
		foreach (string role in roles)
		{
			claims.Add(new Claim(ClaimTypes.Role, role));
		}

		SymmetricSecurityKey key =
			new(
				Encoding.UTF8.GetBytes(jwtSettings.Value.SecretKey));

		SigningCredentials credentials =
			new(
				key,
				SecurityAlgorithms.HmacSha256);

		DateTime expires =
			timeProvider
			.GetUtcNow()
			.AddMinutes(jwtSettings.Value.AccessTokenExpirationMinutes)
			.UtcDateTime;

		JwtSecurityToken token =
			new(
				issuer: jwtSettings.Value.Issuer,
				audience: jwtSettings.Value.Audience,
				claims: claims,
				expires: expires,
				signingCredentials: credentials);

		return new JwtSecurityTokenHandler().WriteToken(token);
	}

	/// <inheritdoc/>
	public async Task<string> GenerateRefreshTokenAsync(
		long userId,
		string? clientIp,
		bool rememberMe = false,
		CancellationToken cancellationToken = default)
	{
		// Create new family for fresh token generation
		return await GenerateRefreshTokenInternalAsync(
			userId,
			clientIp,
			rememberMe,
			familyId: Guid.NewGuid(),
			sessionStartedAt: null,
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<string?> RotateRefreshTokenAsync(
		string refreshToken,
		string? clientIp,
		CancellationToken cancellationToken = default)
	{
		string tokenHash =
			CryptoExtensions.ComputeSha256Hash(refreshToken);

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		// Find the token (including revoked ones for reuse detection)
		RefreshToken? existingToken =
			await tokenRepository.GetByTokenHashAsync(
				tokenHash,
				cancellationToken);

		// Token not found
		if (existingToken == null)
		{
			return null;
		}

		// Token expired
		if (existingToken.ExpiresAt <= now)
		{
			return null;
		}

		// Check absolute session timeout (30 days from session start)
		DateTime absoluteTimeout =
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

			return null;
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

			return null;
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
		return await GenerateRefreshTokenInternalAsync(
			existingToken.UserId,
			clientIp,
			rememberMe,
			existingToken.FamilyId,
			existingToken.SessionStartedAt,
			cancellationToken);
	}

	/// <summary>
	/// Internal method to generate a refresh token with specified family.
	/// </summary>
	/// <param name="userId">
	/// The user id the token belongs to.
	/// </param>
	/// <param name="clientIp">
	/// Optional client IP address for auditing.
	/// </param>
	/// <param name="rememberMe">
	/// Whether token should use long-lived expiration.
	/// </param>
	/// <param name="familyId">
	/// Token family GUID used to group related tokens.
	/// </param>
	/// <param name="sessionStartedAt">
	/// Optional session start timestamp for absolute timeouts.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The generated plaintext refresh token.
	/// </returns>
	private async Task<string> GenerateRefreshTokenInternalAsync(
		long userId,
		string? clientIp,
		bool rememberMe,
		Guid familyId,
		DateTime? sessionStartedAt = null,
		CancellationToken cancellationToken = default)
	{
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		// Enforce session limit - revoke oldest if at max
		await EnforceSessionLimitAsync(userId, now, cancellationToken);

		// Generate cryptographically secure random token using shared utility
		string plainTextToken =
			CryptoExtensions.GenerateSecureToken();

		string tokenHash =
			CryptoExtensions.ComputeSha256Hash(plainTextToken);

		int expirationDays =
			rememberMe
			? jwtSettings.Value.RefreshTokenRememberMeExpirationDays
			: jwtSettings.Value.RefreshTokenExpirationDays;

		RefreshToken refreshToken =
			new()
			{
				TokenHash = tokenHash,
				UserId = userId,
				FamilyId = familyId,
				ExpiresAt =
					now.AddDays(expirationDays),
				SessionStartedAt =
					sessionStartedAt ?? now,
				CreateDate = now,
				IsRevoked = false,
				CreatedByIp = clientIp,
			};

		await tokenRepository.CreateAsync(refreshToken, cancellationToken);

		return plainTextToken;
	}

	/// <summary>
	/// Revokes oldest token if user has reached max active sessions.
	/// </summary>
	/// <param name="userId">
	/// The user ID to enforce limits for.
	/// </param>
	/// <param name="now">
	/// Current timestamp used for comparisons.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	private async Task EnforceSessionLimitAsync(
		long userId,
		DateTime now,
		CancellationToken cancellationToken)
	{
		// Skip session limit enforcement when rotation is disabled (E2E testing)
		// to allow parallel workers to share auth state without token revocation
		if (authSettings.Value.Token.DisableRotation)
		{
			return;
		}

		int maxSessions =
			authSettings.Value.Token.MaxActiveSessionsPerUser;

		int activeTokenCount =
			await tokenRepository.GetActiveSessionCountAsync(
				userId,
				now,
				cancellationToken);

		if (activeTokenCount < maxSessions)
		{
			return;
		}

		// Revoke oldest active token to make room for new one
		await tokenRepository.RevokeOldestActiveTokenAsync(
			userId,
			now,
			now,
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<long?> ValidateRefreshTokenAsync(
		string refreshToken,
		CancellationToken cancellationToken = default)
	{
		string tokenHash =
			CryptoExtensions.ComputeSha256Hash(refreshToken);

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		return await tokenRepository.ValidateTokenAsync(
			tokenHash,
			now,
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> RevokeRefreshTokenAsync(
		string refreshToken,
		CancellationToken cancellationToken = default)
	{
		string tokenHash =
			CryptoExtensions.ComputeSha256Hash(refreshToken);

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		return await tokenRepository.RevokeByHashAsync(
			tokenHash,
			now,
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<int> RevokeAllUserTokensAsync(
		long userId,
		CancellationToken cancellationToken = default)
	{
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		return await tokenRepository.RevokeAllUserTokensAsync(
			userId,
			now,
			cancellationToken);
	}
}