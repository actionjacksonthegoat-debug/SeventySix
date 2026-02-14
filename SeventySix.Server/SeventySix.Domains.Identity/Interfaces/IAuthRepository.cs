// <copyright file="IAuthRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Repository for authentication-related data access beyond UserManager scope.
/// </summary>
/// <remarks>
/// Follows DIP - services depend on abstraction, not DbContext.
/// Provides operations that UserManager doesn't support directly.
/// Most user operations should use UserManager&lt;ApplicationUser&gt; instead.
/// </remarks>
public interface IAuthRepository
{
	/// <summary>
	/// Updates last login timestamp and IP address.
	/// </summary>
	/// <param name="userId">
	/// The user ID.
	/// </param>
	/// <param name="loginTime">
	/// The login timestamp.
	/// </param>
	/// <param name="clientIp">
	/// The client IP address.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	public Task UpdateLastLoginAsync(
		long userId,
		DateTime loginTime,
		string? clientIp,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Finds a user by username or email in a single query.
	/// </summary>
	/// <param name="usernameOrEmail">
	/// The username or email to search for.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The user if found; otherwise null.
	/// </returns>
	public Task<ApplicationUser?> FindByUsernameOrEmailAsync(
		string usernameOrEmail,
		CancellationToken cancellationToken = default);
}