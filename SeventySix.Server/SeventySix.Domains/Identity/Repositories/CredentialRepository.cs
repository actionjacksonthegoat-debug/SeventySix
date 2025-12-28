// <copyright file="CredentialRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

/// <summary>
/// Repository for user credential data access operations.
/// </summary>
/// <remarks>
/// Encapsulates all DbContext operations for user credentials.
/// Internal visibility enforces service facade pattern.
/// </remarks>
internal class CredentialRepository(IdentityDbContext context)
	: ICredentialRepository
{
	/// <inheritdoc/>
	public async Task<UserCredential?> GetByUserIdAsync(
		long userId,
		CancellationToken cancellationToken = default) =>
		await context
			.UserCredentials
			.AsNoTracking()
			.FirstOrDefaultAsync(
				credential => credential.UserId == userId,
				cancellationToken);

	/// <inheritdoc/>
	public async Task<UserCredential?> GetByUserIdForUpdateAsync(
		long userId,
		CancellationToken cancellationToken = default) =>
		await context.UserCredentials.FirstOrDefaultAsync(
			credential => credential.UserId == userId,
			cancellationToken);

	/// <inheritdoc/>
	public async Task CreateAsync(
		UserCredential credential,
		CancellationToken cancellationToken = default)
	{
		context.UserCredentials.Add(credential);
		await context.SaveChangesAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task UpdateAsync(
		UserCredential credential,
		CancellationToken cancellationToken = default)
	{
		await context.SaveChangesAsync(cancellationToken);
	}
}