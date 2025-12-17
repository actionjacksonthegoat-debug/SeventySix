// <copyright file="EmailVerificationTokenRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

/// <summary>
/// Repository for email verification token data access operations.
/// </summary>
/// <remarks>
/// Encapsulates DbContext operations for email verification tokens.
/// Internal visibility enforces service facade pattern.
/// </remarks>
internal class EmailVerificationTokenRepository(IdentityDbContext context)
	: IEmailVerificationTokenRepository
{
	/// <inheritdoc/>
	public async Task<EmailVerificationToken?> GetByHashAsync(
		string tokenHash,
		CancellationToken cancellationToken = default) =>
		await context.EmailVerificationTokens.FirstOrDefaultAsync(
			verificationToken => verificationToken.TokenHash == tokenHash,
			cancellationToken);

	/// <inheritdoc/>
	public async Task CreateAsync(
		EmailVerificationToken token,
		CancellationToken cancellationToken = default)
	{
		context.EmailVerificationTokens.Add(token);
		await context.SaveChangesAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<int> InvalidateTokensForEmailAsync(
		string email,
		CancellationToken cancellationToken = default)
	{
		string lowerEmail = email.ToLower();

		return await context
			.EmailVerificationTokens
			.Where(token =>
				token.Email.ToLower() == lowerEmail)
			.Where(token => !token.IsUsed)
			.ExecuteUpdateAsync(
				setters => setters.SetProperty(token => token.IsUsed, true),
				cancellationToken);
	}

	/// <inheritdoc/>
	public async Task SaveChangesAsync(
		EmailVerificationToken token,
		CancellationToken cancellationToken = default) => await context.SaveChangesAsync(cancellationToken);
}