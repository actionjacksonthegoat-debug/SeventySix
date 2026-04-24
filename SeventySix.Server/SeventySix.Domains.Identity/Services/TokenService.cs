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
/// Refresh token rotation — including reuse-attack detection and absolute session
/// timeout enforcement — is handled by the private rotation methods in this class.
/// </remarks>
internal sealed class TokenService(
	ITokenRepository tokenRepository,
	ISessionManagementService sessionManagementService,
	IOptions<JwtSettings> jwtSettings,
	TimeProvider timeProvider,
	ILogger<TokenService> logger) : ITokenService
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
				Encoding.UTF8.GetBytes(jwtSettings.Value.SecretKey))
			{
				KeyId = jwtSettings.Value.GetEffectiveKeyId(),
			};

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
	public IssuedAccessToken IssueAccessToken(
		long userId,
		string username,
		IList<string> roles,
		bool requiresPasswordChange = false)
	{
		string accessToken =
			GenerateAccessToken(
				userId,
				username,
				roles,
				requiresPasswordChange);

		DateTimeOffset expiresAt =
			timeProvider.GetUtcNow()
				.AddMinutes(jwtSettings.Value.AccessTokenExpirationMinutes);

		return new IssuedAccessToken(accessToken, expiresAt);
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

		RefreshToken? existingToken =
			await tokenRepository.GetByTokenHashAsync(
				tokenHash,
				cancellationToken);

		if (existingToken is null)
		{
			return (null, false);
		}

		if (existingToken.ExpiresAt <= now)
		{
			return (null, false);
		}

		(string? Token, bool RememberMe)? timeoutResult =
			await ValidateAbsoluteSessionTimeoutAsync(
				existingToken,
				now,
				cancellationToken);

		if (timeoutResult is not null)
		{
			return timeoutResult.Value;
		}

		(string? Token, bool RememberMe)? reuseResult =
			await DetectReuseAttackAsync(
				existingToken,
				now,
				cancellationToken);

		if (reuseResult is not null)
		{
			return reuseResult.Value;
		}

		bool rememberMe =
			DeriveRememberMe(existingToken);

		await tokenRepository.RevokeAsync(
			existingToken,
			now,
			cancellationToken);

		string newToken =
			await IssueRotatedTokenAsync(
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

	/// <summary>
	/// Returns a failure tuple when the absolute session timeout has been exceeded,
	/// revoking the current token. Returns <see langword="null"/> when within bounds.
	/// </summary>
	/// <param name="existingToken">
	/// The token being rotated.
	/// </param>
	/// <param name="now">
	/// Current UTC timestamp.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A failed rotation tuple if the session has expired; otherwise <see langword="null"/>.
	/// </returns>
	private async Task<(string? Token, bool RememberMe)?> ValidateAbsoluteSessionTimeoutAsync(
		RefreshToken existingToken,
		DateTimeOffset now,
		CancellationToken cancellationToken)
	{
		DateTimeOffset absoluteTimeout =
			existingToken.SessionStartedAt.AddDays(
				jwtSettings.Value.AbsoluteSessionTimeoutDays);

		if (now < absoluteTimeout)
		{
			return null;
		}

		logger.LogWarning(
			"Absolute session timeout reached for user {UserId}. Session started: {SessionStartedAt}",
			existingToken.UserId,
			existingToken.SessionStartedAt);

		await tokenRepository.RevokeAsync(
			existingToken,
			now,
			cancellationToken);

		return (null, false);
	}

	/// <summary>
	/// Returns a failure tuple and revokes the entire token family when a reuse
	/// attack is detected (a revoked token being presented again).
	/// Returns <see langword="null"/> when no reuse is detected.
	/// </summary>
	/// <param name="existingToken">
	/// The token being rotated.
	/// </param>
	/// <param name="now">
	/// Current UTC timestamp.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A failed rotation tuple if a reuse attack is detected; otherwise <see langword="null"/>.
	/// </returns>
	private async Task<(string? Token, bool RememberMe)?> DetectReuseAttackAsync(
		RefreshToken existingToken,
		DateTimeOffset now,
		CancellationToken cancellationToken)
	{
		if (!existingToken.IsRevoked)
		{
			return null;
		}

		logger.LogWarning(
			"Token reuse attack detected for user {UserId}, revoking family {FamilyId}",
			existingToken.UserId,
			existingToken.FamilyId);

		await tokenRepository.RevokeFamilyAsync(
			existingToken.FamilyId,
			now,
			cancellationToken);

		return (null, false);
	}

	/// <summary>
	/// Derives the rememberMe flag from the original token lifetime.
	/// </summary>
	/// <param name="existingToken">
	/// The token being rotated.
	/// </param>
	/// <returns>
	/// <see langword="true"/> when the token lifetime exceeds the standard
	/// refresh token expiration days.
	/// </returns>
	private bool DeriveRememberMe(RefreshToken existingToken)
	{
		int tokenLifetimeDays =
			(int)(existingToken.ExpiresAt - existingToken.SessionStartedAt).TotalDays;

		return tokenLifetimeDays > jwtSettings.Value.RefreshTokenExpirationDays;
	}

	/// <summary>
	/// Creates and persists the replacement refresh token, inheriting the family
	/// and session-start timestamp of the revoked token.
	/// </summary>
	/// <param name="userId">
	/// The user's ID.
	/// </param>
	/// <param name="rememberMe">
	/// Whether to use extended token expiration.
	/// </param>
	/// <param name="familyId">
	/// Token family identifier inherited from the original token.
	/// </param>
	/// <param name="sessionStartedAt">
	/// Original session start timestamp for absolute-timeout tracking.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The new plaintext refresh token.
	/// </returns>
	private async Task<string> IssueRotatedTokenAsync(
		long userId,
		bool rememberMe,
		Guid familyId,
		DateTimeOffset sessionStartedAt,
		CancellationToken cancellationToken)
	{
		DateTimeOffset now =
			timeProvider.GetUtcNow();

		await sessionManagementService.EnforceSessionLimitAsync(
			userId,
			now,
			cancellationToken);

		string plainTextToken =
			CryptoExtensions.GenerateSecureToken();

		string tokenHash =
			CryptoExtensions.ComputeSha256Hash(plainTextToken);

		int expirationDays =
			rememberMe
			? jwtSettings.Value.RefreshTokenRememberMeExpirationDays
			: jwtSettings.Value.RefreshTokenExpirationDays;

		RefreshToken rotatedToken =
			new()
			{
				TokenHash = tokenHash,
				UserId = userId,
				FamilyId = familyId,
				ExpiresAt = now.AddDays(expirationDays),
				SessionStartedAt = sessionStartedAt,
				CreateDate = now,
				IsRevoked = false,
			};

		await tokenRepository.CreateAsync(rotatedToken, cancellationToken);

		return plainTextToken;
	}
}