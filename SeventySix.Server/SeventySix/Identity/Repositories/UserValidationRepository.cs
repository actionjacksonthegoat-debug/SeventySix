// <copyright file="UserValidationRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

/// <summary>
/// User validation data access implementation.
/// </summary>
internal class UserValidationRepository(IdentityDbContext context) : IUserValidationRepository
{
	/// <inheritdoc/>
	public async Task<bool> UsernameExistsAsync(
		string username,
		int? excludeId = null,
		CancellationToken cancellationToken = default)
	{
		return await context.Users
			.AsNoTracking()
			.Where(user => EF.Functions.ILike(user.Username, username))
			.Where(user => !excludeId.HasValue || user.Id != excludeId.Value)
			.AnyAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> EmailExistsAsync(
		string email,
		int? excludeId = null,
		CancellationToken cancellationToken = default)
	{
		return await context.Users
			.AsNoTracking()
			.Where(user => EF.Functions.ILike(user.Email, email))
			.Where(user => !excludeId.HasValue || user.Id != excludeId.Value)
			.AnyAsync(cancellationToken);
	}
}