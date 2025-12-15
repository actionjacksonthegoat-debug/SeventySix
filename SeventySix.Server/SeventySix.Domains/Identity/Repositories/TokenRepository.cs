// <copyright file="TokenRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

/// <summary>
/// Repository for refresh token data access operations.
/// </summary>
/// <remarks>
/// Encapsulates all DbContext operations for refresh tokens.
/// Internal visibility enforces service facade pattern.
/// </remarks>
internal class TokenRepository(IdentityDbContext context) : ITokenRepository
{
	/// <inheritdoc/>
	public async Task<RefreshToken?> GetByTokenHashAsync(
		string tokenHash,
		CancellationToken cancellationToken = default) =>
		await context.RefreshTokens.FirstOrDefaultAsync(
			token => token.TokenHash == tokenHash,
			cancellationToken);

	/// <inheritdoc/>
	public async Task<int> GetActiveSessionCountAsync(
		int userId,
		DateTime currentTime,
		CancellationToken cancellationToken = default) =>
		await context
			.RefreshTokens
			.Where(token => token.UserId == userId)
			.Where(token => !token.IsRevoked)
			.Where(token => token.ExpiresAt > currentTime)
			.CountAsync(cancellationToken);

	/// <inheritdoc/>
	public async Task CreateAsync(
		RefreshToken token,
		CancellationToken cancellationToken = default)
	{
		context.RefreshTokens.Add(token);
		await context.SaveChangesAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task RevokeAsync(
		RefreshToken token,
		DateTime revokedAt,
		CancellationToken cancellationToken = default)
	{
		token.IsRevoked = true;
		token.RevokedAt = revokedAt;
		await context.SaveChangesAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<int> RevokeAllUserTokensAsync(
		int userId,
		DateTime revokedAt,
		CancellationToken cancellationToken = default) =>
		await context
			.RefreshTokens
			.Where(token => token.UserId == userId)
			.Where(token => !token.IsRevoked)
			.ExecuteUpdateAsync(
				setters =>
					setters
						.SetProperty(token => token.IsRevoked, true)
						.SetProperty(token => token.RevokedAt, revokedAt),
				cancellationToken);

	/// <inheritdoc/>
	public async Task RevokeFamilyAsync(
		Guid familyId,
		DateTime revokedAt,
		CancellationToken cancellationToken = default) =>
		await context
			.RefreshTokens
			.Where(token => token.FamilyId == familyId)
			.Where(token => !token.IsRevoked)
			.ExecuteUpdateAsync(
				setters =>
					setters
						.SetProperty(token => token.IsRevoked, true)
						.SetProperty(token => token.RevokedAt, revokedAt),
				cancellationToken);

	/// <inheritdoc/>
	public async Task RevokeOldestActiveTokenAsync(
		int userId,
		DateTime currentTime,
		DateTime revokedAt,
		CancellationToken cancellationToken = default) =>
		await context
			.RefreshTokens
			.Where(token => token.UserId == userId)
			.Where(token => !token.IsRevoked)
			.Where(token => token.ExpiresAt > currentTime)
			.OrderBy(token => token.CreateDate)
			.Take(1)
			.ExecuteUpdateAsync(
				setters =>
					setters
						.SetProperty(token => token.IsRevoked, true)
						.SetProperty(token => token.RevokedAt, revokedAt),
				cancellationToken);

	/// <inheritdoc/>
	public async Task<int?> ValidateTokenAsync(
		string tokenHash,
		DateTime currentTime,
		CancellationToken cancellationToken = default)
	{
		RefreshToken? token =
			await context
				.RefreshTokens
				.AsNoTracking()
				.Where(token => token.TokenHash == tokenHash)
				.Where(token => !token.IsRevoked)
				.Where(token => token.ExpiresAt > currentTime)
				.FirstOrDefaultAsync(cancellationToken);

		return token?.UserId;
	}

	/// <inheritdoc/>
	public async Task<bool> RevokeByHashAsync(
		string tokenHash,
		DateTime revokedAt,
		CancellationToken cancellationToken = default)
	{
		int rowsAffected =
			await context
				.RefreshTokens
				.Where(token => token.TokenHash == tokenHash)
				.Where(token => !token.IsRevoked)
				.ExecuteUpdateAsync(
					setters =>
						setters
							.SetProperty(token => token.IsRevoked, true)
							.SetProperty(token => token.RevokedAt, revokedAt),
					cancellationToken);

		return rowsAffected > 0;
	}
}
