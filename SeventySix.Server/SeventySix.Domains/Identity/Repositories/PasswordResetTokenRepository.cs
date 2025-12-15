// <copyright file="PasswordResetTokenRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

/// <summary>
/// Repository for password reset token data access operations.
/// </summary>
/// <remarks>
/// Encapsulates all DbContext operations for password reset tokens.
/// Internal visibility enforces service facade pattern.
/// </remarks>
internal class PasswordResetTokenRepository(
	IdentityDbContext context) : IPasswordResetTokenRepository
{
	/// <inheritdoc/>
	public async Task<PasswordResetToken?> GetByHashAsync(
		string tokenHash,
		CancellationToken cancellationToken = default) =>
		await context.PasswordResetTokens
			.FirstOrDefaultAsync(
				token => token.Token == tokenHash,
				cancellationToken);

	/// <inheritdoc/>
	public async Task CreateAsync(
		PasswordResetToken token,
		CancellationToken cancellationToken = default)
	{
		context.PasswordResetTokens.Add(token);
		await context.SaveChangesAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task MarkAsUsedAsync(
		PasswordResetToken token,
		CancellationToken cancellationToken = default)
	{
		token.IsUsed = true;
		await context.SaveChangesAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<int> InvalidateAllUserTokensAsync(
		int userId,
		DateTime invalidatedAt,
		CancellationToken cancellationToken = default) =>
		await context.PasswordResetTokens
			.Where(token => token.UserId == userId)
			.Where(token => !token.IsUsed)
			.Where(token => token.ExpiresAt > invalidatedAt)
			.ExecuteUpdateAsync(
				setters => setters
					.SetProperty(token => token.IsUsed, true),
				cancellationToken);
}