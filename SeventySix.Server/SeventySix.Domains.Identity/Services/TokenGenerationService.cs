// <copyright file="TokenGenerationService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SeventySix.Shared.Extensions;

namespace SeventySix.Identity;

/// <summary>
/// Generates JWT access tokens and cryptographic refresh tokens.
/// </summary>
/// <remarks>
/// Access tokens are stateless JWTs with short expiration.
/// Refresh tokens are random bytes, SHA256 hashed before storage.
/// PII (email, fullName) is NOT included in JWT for GDPR compliance.
/// </remarks>
public sealed class TokenGenerationService(
	ITokenRepository tokenRepository,
	ISessionManagementService sessionManagementService,
	IOptions<JwtSettings> jwtSettings,
	TimeProvider timeProvider) : ITokenGenerationService
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
	public async Task<string> GenerateRefreshTokenWithFamilyAsync(
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