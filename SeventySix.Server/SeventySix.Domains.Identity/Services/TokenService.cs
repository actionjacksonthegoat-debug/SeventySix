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
/// Handles JWT access token generation, refresh token lifecycle, and token revocation.
/// </summary>
/// <remarks>
/// Access tokens are stateless JWTs with short expiration.
/// Refresh tokens are random bytes, SHA256 hashed before storage.
/// PII (email, fullName) is NOT included in JWT claims for GDPR compliance.
/// Handles revoking individual tokens, token families (reuse attack response),
/// and all tokens for a user (logout-all, account compromise response).
/// </remarks>
public sealed class TokenService(
	ITokenRepository tokenRepository,
	ISessionManagementService sessionManagementService,
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
		bool requiresPasswordChange = false)
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

		foreach (string role in roles)
		{
			claims.Add(new Claim(ClaimTypes.Role, role));
		}

		if (requiresPasswordChange)
		{
			claims.Add(
				new Claim(
					CustomClaimTypes.RequiresPasswordChange,
					"true"));
		}

		SymmetricSecurityKey key =
			new(
				Encoding.UTF8.GetBytes(jwtSettings.Value.SecretKey));

		SigningCredentials credentials =
			new(
				key,
				SecurityAlgorithms.HmacSha256);

		DateTimeOffset expires =
			timeProvider.GetUtcNow().AddMinutes(
				jwtSettings.Value.AccessTokenExpirationMinutes);

		JwtSecurityToken token =
			new(
				issuer: jwtSettings.Value.Issuer,
				audience: jwtSettings.Value.Audience,
				claims: claims,
				expires: expires.UtcDateTime,
				signingCredentials: credentials);

		return new JwtSecurityTokenHandler().WriteToken(token);
	}

	/// <inheritdoc/>
	public async Task<string> GenerateRefreshTokenAsync(
		long userId,
		bool rememberMe = false,
		CancellationToken cancellationToken = default)
	{
		return await GenerateRefreshTokenWithFamilyAsync(
			userId,
			rememberMe,
			familyId: Guid.NewGuid(),
			sessionStartedAt: null,
			cancellationToken);
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
		// Reuse detection ALWAYS runs regardless of DisableRotation —
		// the flag only skips issuing a new token, never weakens security
		if (existingToken.IsRevoked)
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
			await GenerateRefreshTokenWithFamilyAsync(
				existingToken.UserId,
				rememberMe,
				existingToken.FamilyId,
				existingToken.SessionStartedAt,
				cancellationToken);

		return (newToken, rememberMe);
	}

	/// <inheritdoc/>
	public async Task<bool> RevokeRefreshTokenAsync(
		string refreshToken,
		CancellationToken cancellationToken = default)
	{
		string tokenHash =
			CryptoExtensions.ComputeSha256Hash(refreshToken);

		DateTimeOffset now =
			timeProvider.GetUtcNow();

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
		DateTimeOffset now =
			timeProvider.GetUtcNow();

		return await tokenRepository.RevokeAllUserTokensAsync(
			userId,
			now,
			cancellationToken);
	}

	/// <summary>
	/// Generates a new refresh token inheriting an existing token family.
	/// Used during token rotation to maintain family tracking for reuse detection.
	/// </summary>
	/// <param name="userId">
	/// The user's ID.
	/// </param>
	/// <param name="rememberMe">
	/// Whether to extend refresh token expiration.
	/// </param>
	/// <param name="familyId">
	/// The token family GUID to inherit.
	/// </param>
	/// <param name="sessionStartedAt">
	/// Optional session start timestamp for absolute timeout tracking.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The plaintext refresh token (hash stored in database).
	/// </returns>
	private async Task<string> GenerateRefreshTokenWithFamilyAsync(
		long userId,
		bool rememberMe,
		Guid familyId,
		DateTimeOffset? sessionStartedAt = null,
		CancellationToken cancellationToken = default)
	{
		DateTimeOffset now =
			timeProvider.GetUtcNow();

		// Enforce session limit - revoke oldest if at max
		await sessionManagementService.EnforceSessionLimitAsync(
			userId,
			now,
			cancellationToken);

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
			};

		await tokenRepository.CreateAsync(refreshToken, cancellationToken);

		return plainTextToken;
	}
}