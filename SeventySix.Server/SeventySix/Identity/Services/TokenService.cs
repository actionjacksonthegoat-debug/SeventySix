// <copyright file="TokenService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SeventySix.Shared;

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
/// </remarks>
public class TokenService(
	IdentityDbContext context,
	IOptions<JwtSettings> jwtSettings,
	IOptions<AuthSettings> authSettings,
	TimeProvider timeProvider) : ITokenService
{
	/// <inheritdoc/>
	public string GenerateAccessToken(
		int userId,
		string username,
		string email,
		string? fullName,
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
				JwtRegisteredClaimNames.Email,
				email),
			new Claim(
				JwtRegisteredClaimNames.GivenName,
				fullName ?? string.Empty),
			new Claim(
				JwtRegisteredClaimNames.Jti,
				Guid.NewGuid().ToString()),
			new Claim(
				JwtRegisteredClaimNames.Iat,
				timeProvider.GetUtcNow().ToUnixTimeSeconds().ToString(),
				ClaimValueTypes.Integer64)
		];

		// Add role claims
		foreach (string role in roles)
		{
			claims.Add(new Claim(ClaimTypes.Role, role));
		}

		SymmetricSecurityKey key =
			new(Encoding.UTF8.GetBytes(jwtSettings.Value.SecretKey));

		SigningCredentials credentials =
			new(key, SecurityAlgorithms.HmacSha256);

		DateTime expires =
			timeProvider.GetUtcNow()
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
		int userId,
		string? clientIp,
		CancellationToken cancellationToken = default)
	{
		// Create new family for fresh token generation
		return await GenerateRefreshTokenInternalAsync(
			userId,
			clientIp,
			familyId: Guid.NewGuid(),
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
			await context.RefreshTokens
				.Where(t => t.TokenHash == tokenHash)
				.FirstOrDefaultAsync(cancellationToken);

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

		// REUSE ATTACK DETECTED: Token already revoked but attacker trying to use it
		if (existingToken.IsRevoked)
		{
			// Revoke entire token family - this invalidates the legitimate user's token too
			await RevokeFamilyAsync(
				existingToken.FamilyId,
				now,
				cancellationToken);

			return null;
		}

		// Valid rotation - revoke current token
		existingToken.IsRevoked = true;
		existingToken.RevokedAt = now;
		await context.SaveChangesAsync(cancellationToken);

		// Generate new token inheriting the family
		return await GenerateRefreshTokenInternalAsync(
			existingToken.UserId,
			clientIp,
			existingToken.FamilyId,
			cancellationToken);
	}

	/// <summary>
	/// Internal method to generate a refresh token with specified family.
	/// </summary>
	private async Task<string> GenerateRefreshTokenInternalAsync(
		int userId,
		string? clientIp,
		Guid familyId,
		CancellationToken cancellationToken)
	{
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		// Enforce session limit - revoke oldest if at max
		await EnforceSessionLimitAsync(
			userId,
			now,
			cancellationToken);

		// Generate cryptographically secure random token using shared utility
		string plainTextToken =
			CryptoExtensions.GenerateSecureToken();

		string tokenHash =
			CryptoExtensions.ComputeSha256Hash(plainTextToken);

		RefreshToken refreshToken =
			new()
			{
				TokenHash = tokenHash,
				UserId = userId,
				FamilyId = familyId,
				ExpiresAt =
					now.AddDays(jwtSettings.Value.RefreshTokenExpirationDays),
				CreatedAt = now,
				IsRevoked = false,
				CreatedByIp = clientIp
			};

		context.RefreshTokens.Add(refreshToken);
		await context.SaveChangesAsync(cancellationToken);

		return plainTextToken;
	}

	/// <summary>
	/// Revokes all tokens in a family (for reuse attack response).
	/// </summary>
	private async Task RevokeFamilyAsync(
		Guid familyId,
		DateTime now,
		CancellationToken cancellationToken)
	{
		await context.RefreshTokens
			.Where(t => t.FamilyId == familyId)
			.Where(t => !t.IsRevoked)
			.ExecuteUpdateAsync(
				setters => setters
					.SetProperty(t => t.IsRevoked, true)
					.SetProperty(t => t.RevokedAt, now),
				cancellationToken);
	}

	/// <summary>
	/// Revokes oldest token if user has reached max active sessions.
	/// </summary>
	private async Task EnforceSessionLimitAsync(
		int userId,
		DateTime now,
		CancellationToken cancellationToken)
	{
		int maxSessions =
			authSettings.Value.Token.MaxActiveSessionsPerUser;

		int activeTokenCount =
			await context.RefreshTokens
				.Where(token => token.UserId == userId)
				.Where(token => !token.IsRevoked)
				.Where(token => token.ExpiresAt > now)
				.CountAsync(cancellationToken);

		if (activeTokenCount < maxSessions)
		{
			return;
		}

		// Revoke oldest active token to make room for new one
		await context.RefreshTokens
			.Where(token => token.UserId == userId)
			.Where(token => !token.IsRevoked)
			.Where(token => token.ExpiresAt > now)
			.OrderBy(token => token.CreatedAt)
			.Take(1)
			.ExecuteUpdateAsync(
				setters => setters
					.SetProperty(token => token.IsRevoked, true)
					.SetProperty(token => token.RevokedAt, now),
				cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<int?> ValidateRefreshTokenAsync(
		string refreshToken,
		CancellationToken cancellationToken = default)
	{
		string tokenHash =
			CryptoExtensions.ComputeSha256Hash(refreshToken);

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		RefreshToken? token =
			await context.RefreshTokens
				.AsNoTracking()
				.Where(t => t.TokenHash == tokenHash)
				.Where(t => !t.IsRevoked)
				.Where(t => t.ExpiresAt > now)
				.FirstOrDefaultAsync(cancellationToken);

		return token?.UserId;
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

		int rowsAffected =
			await context.RefreshTokens
				.Where(t => t.TokenHash == tokenHash)
				.Where(t => !t.IsRevoked)
				.ExecuteUpdateAsync(
					setters => setters
						.SetProperty(t => t.IsRevoked, true)
						.SetProperty(t => t.RevokedAt, now),
					cancellationToken);

		return rowsAffected > 0;
	}

	/// <inheritdoc/>
	public async Task<int> RevokeAllUserTokensAsync(
		int userId,
		CancellationToken cancellationToken = default)
	{
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		return await context.RefreshTokens
			.Where(t => t.UserId == userId)
			.Where(t => !t.IsRevoked)
			.ExecuteUpdateAsync(
				setters => setters
					.SetProperty(t => t.IsRevoked, true)
					.SetProperty(t => t.RevokedAt, now),
				cancellationToken);
	}
}