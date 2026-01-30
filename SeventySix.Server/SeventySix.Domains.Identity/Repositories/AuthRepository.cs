// <copyright file="AuthRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

/// <summary>
/// Repository for authentication-related data access beyond UserManager scope.
/// </summary>
/// <remarks>
/// Encapsulates DbContext operations for authentication flows.
/// Internal visibility enforces service facade pattern.
/// Most operations now use UserManager; this handles custom fields.
/// </remarks>
internal class AuthRepository(IdentityDbContext context) : IAuthRepository
{
	/// <inheritdoc/>
	public async Task UpdateLastLoginAsync(
		long userId,
		DateTime loginTime,
		string? clientIp,
		CancellationToken cancellationToken = default) =>
		await context
			.Users
			.Where(user => user.Id == userId)
			.ExecuteUpdateAsync(
				setters =>
					setters
						.SetProperty(
							user => user.LastLoginAt,
							loginTime)
						.SetProperty(
							user => user.LastLoginIp,
							clientIp),
				cancellationToken);
}