// <copyright file="IAuthRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Repository for authentication-related data access.
/// </summary>
/// <remarks>
/// Follows DIP - services depend on abstraction, not DbContext.
/// Handles user lookup for login, lockout tracking, and external logins.
/// Complements existing repositories (IUserQueryRepository, ICredentialRepository).
/// </remarks>
public interface IAuthRepository
{
	/// <summary>
	/// Gets user by username or email for login.
	/// </summary>
	/// <param name="usernameOrEmail">The username or email to search for.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The user if found; otherwise, null.</returns>
	/// <remarks>Tracked query - needed for lockout updates.</remarks>
	public Task<User?> GetUserByUsernameOrEmailForUpdateAsync(
		string usernameOrEmail,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Updates failed login count and optional lockout end time.
	/// </summary>
	/// <param name="user">The tracked user entity to update.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	public Task SaveUserChangesAsync(
		User user,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Updates last login timestamp and IP address.
	/// </summary>
	/// <param name="userId">The user ID.</param>
	/// <param name="loginTime">The login timestamp.</param>
	/// <param name="clientIp">The client IP address.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	public Task UpdateLastLoginAsync(
		int userId,
		DateTime loginTime,
		string? clientIp,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets external login by provider and provider user ID.
	/// </summary>
	/// <param name="provider">The OAuth provider name.</param>
	/// <param name="providerUserId">The user ID from the provider.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The external login if found; otherwise, null.</returns>
	public Task<ExternalLogin?> GetExternalLoginAsync(
		string provider,
		string providerUserId,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Creates a new external login record.
	/// </summary>
	/// <param name="externalLogin">The external login entity.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	public Task CreateExternalLoginAsync(
		ExternalLogin externalLogin,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Updates external login last used timestamp.
	/// </summary>
	/// <param name="externalLogin">The tracked external login entity.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	public Task UpdateExternalLoginAsync(
		ExternalLogin externalLogin,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Checks if a username already exists.
	/// </summary>
	/// <param name="username">The username to check.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>True if username exists; otherwise, false.</returns>
	public Task<bool> UsernameExistsAsync(
		string username,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Creates a new user with role assignment.
	/// </summary>
	/// <param name="user">The user entity.</param>
	/// <param name="roleId">The role ID to assign.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The created user with ID populated.</returns>
	public Task<User> CreateUserWithRoleAsync(
		User user,
		int roleId,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets role ID by name.
	/// </summary>
	/// <param name="roleName">The role name.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The role ID if found; otherwise, null.</returns>
	public Task<int?> GetRoleIdByNameAsync(
		string roleName,
		CancellationToken cancellationToken = default);
}