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
internal class PasswordResetTokenRepository(IdentityDbContext context)
	: IPasswordResetTokenRepository
{
	/// <inheritdoc/>
	public async Task<PasswordResetToken?> GetByHashAsync(
		string tokenHash,
		CancellationToken cancellationToken = default) =>
		await context.PasswordResetTokens.FirstOrDefaultAsync(
			resetToken => resetToken.TokenHash == tokenHash,
			cancellationToken);

	/// <inheritdoc/>
	public async Task CreateAsync(
		PasswordResetToken resetToken,
		CancellationToken cancellationToken = default)
	{
		context.PasswordResetTokens.Add(resetToken);
		await context.SaveChangesAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task MarkAsUsedAsync(
		PasswordResetToken resetToken,
		CancellationToken cancellationToken = default)
	{
		resetToken.IsUsed = true;
		await context.SaveChangesAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<int> InvalidateAllUserTokensAsync(
		int userId,
		DateTime invalidatedAt,
		CancellationToken cancellationToken = default) =>
		await context
			.PasswordResetTokens
			.Where(resetToken =>
				resetToken.UserId == userId)
			.Where(resetToken => !resetToken.IsUsed)
			.Where(resetToken => resetToken.ExpiresAt > invalidatedAt)
			.ExecuteUpdateAsync(
				setters =>
					setters.SetProperty(resetToken => resetToken.IsUsed, true),
				cancellationToken);
}