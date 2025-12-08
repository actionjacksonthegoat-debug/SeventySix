// <copyright file="AuthRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

/// <summary>
/// Repository for authentication-related data access.
/// </summary>
/// <remarks>
/// Encapsulates DbContext operations for authentication flows.
/// Internal visibility enforces service facade pattern.
/// </remarks>
internal class AuthRepository(
	IdentityDbContext context) : IAuthRepository
{
	/// <inheritdoc/>
	public async Task<User?> GetUserByUsernameOrEmailForUpdateAsync(
		string usernameOrEmail,
		CancellationToken cancellationToken = default) =>
		await context.Users
			.Where(user => user.Username == usernameOrEmail
				|| user.Email == usernameOrEmail)
			.FirstOrDefaultAsync(cancellationToken);

	/// <inheritdoc/>
	public async Task SaveUserChangesAsync(
		User user,
		CancellationToken cancellationToken = default) =>
		await context.SaveChangesAsync(cancellationToken);

	/// <inheritdoc/>
	public async Task UpdateLastLoginAsync(
		int userId,
		DateTime loginTime,
		string? clientIp,
		CancellationToken cancellationToken = default) =>
		await context.Users
			.Where(user => user.Id == userId)
			.ExecuteUpdateAsync(
				setters => setters
					.SetProperty(user => user.LastLoginAt, loginTime)
					.SetProperty(user => user.LastLoginIp, clientIp),
				cancellationToken);

	/// <inheritdoc/>
	public async Task<ExternalLogin?> GetExternalLoginAsync(
		string provider,
		string providerUserId,
		CancellationToken cancellationToken = default) =>
		await context.ExternalLogins
			.Where(externalLogin => externalLogin.Provider == provider)
			.Where(externalLogin => externalLogin.ProviderUserId == providerUserId)
			.FirstOrDefaultAsync(cancellationToken);

	/// <inheritdoc/>
	public async Task CreateExternalLoginAsync(
		ExternalLogin externalLogin,
		CancellationToken cancellationToken = default)
	{
		context.ExternalLogins.Add(externalLogin);
		await context.SaveChangesAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task UpdateExternalLoginAsync(
		ExternalLogin externalLogin,
		CancellationToken cancellationToken = default) =>
		await context.SaveChangesAsync(cancellationToken);

	/// <inheritdoc/>
	public async Task<bool> UsernameExistsAsync(
		string username,
		CancellationToken cancellationToken = default) =>
		await context.Users
			.AnyAsync(
				user => user.Username == username,
				cancellationToken);

	/// <inheritdoc/>
	public async Task<User> CreateUserWithRoleAsync(
		User user,
		int roleId,
		CancellationToken cancellationToken = default)
	{
		context.Users.Add(user);
		await context.SaveChangesAsync(cancellationToken);

		UserRole userRole =
			new()
			{
				UserId = user.Id,
				RoleId = roleId
			};

		context.UserRoles.Add(userRole);
		await context.SaveChangesAsync(cancellationToken);

		return user;
	}

	/// <inheritdoc/>
	public async Task<int?> GetRoleIdByNameAsync(
		string roleName,
		CancellationToken cancellationToken = default) =>
		await context.SecurityRoles
			.Where(role => role.Name == roleName)
			.Select(role => (int?)role.Id)
			.FirstOrDefaultAsync(cancellationToken);
}
