// <copyright file="RegistrationService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Identity.Constants;

namespace SeventySix.Identity;

/// <summary>
/// Service for handling user registration operations.
/// </summary>
/// <remarks>
/// Encapsulates complex registration workflows including user creation,
/// credential setup, role assignment, and token generation.
/// Extracted from static RegistrationHelpers to reduce parameter coupling.
/// </remarks>
public class RegistrationService(
	IAuthRepository authRepository,
	ICredentialRepository credentialRepository,
	IUserQueryRepository userQueryRepository,
	ITokenService tokenService,
	IPasswordHasher passwordHasher,
	IOptions<JwtSettings> jwtSettings,
	TimeProvider timeProvider,
	ILogger<RegistrationService> logger)
{
	/// <summary>
	/// Gets the role ID by name.
	/// </summary>
	/// <param name="roleName">
	/// The role name to look up.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The role ID when found.
	/// </returns>
	/// <exception cref="InvalidOperationException">Thrown if role not found.</exception>
	public async Task<int> GetRoleIdByNameAsync(
		string roleName,
		CancellationToken cancellationToken)
	{
		int? roleId =
			await authRepository.GetRoleIdByNameAsync(
				roleName,
				cancellationToken);

		if (roleId is null)
		{
			logger.LogError(
				"Role '{RoleName}' not found in SecurityRoles",
				roleName);
			throw new InvalidOperationException(
				$"Role '{roleName}' not found in SecurityRoles");
		}

		return roleId.Value;
	}

	/// <summary>
	/// Creates a user with credential and role assignment.
	/// </summary>
	/// <remarks>
	/// Must be called within a transaction.
	/// </remarks>
	/// <param name="username">
	/// The desired username for the new user.
	/// </param>
	/// <param name="email">
	/// The user's email address.
	/// </param>
	/// <param name="fullName">
	/// Optional full name.
	/// </param>
	/// <param name="password">
	/// The initial plaintext password to hash and store.
	/// </param>
	/// <param name="createdBy">
	/// Audit user who created this account.
	/// </param>
	/// <param name="roleId">
	/// Role ID to assign to the new user.
	/// </param>
	/// <param name="requiresPasswordChange">
	/// When true, password change will be required at first login.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The created <see cref="User"/> with ID populated.
	/// </returns>
	public async Task<User> CreateUserWithCredentialAsync(
		string username,
		string email,
		string? fullName,
		string password,
		string createdBy,
		int roleId,
		bool requiresPasswordChange,
		CancellationToken cancellationToken)
	{
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		User newUser =
			new()
			{
				Username = username,
				Email = email,
				FullName = fullName,
				IsActive = true,
				CreateDate = now,
				CreatedBy = createdBy,
			};

		User createdUser =
			await authRepository.CreateUserWithRoleAsync(
				newUser,
				roleId,
				cancellationToken);

		string passwordHash =
			passwordHasher.HashPassword(password);

		UserCredential credential =
			new()
			{
				UserId = createdUser.Id,
				PasswordHash = passwordHash,
				CreateDate = now,
				PasswordChangedAt =
					requiresPasswordChange ? null : now,
			};

		await credentialRepository.CreateAsync(credential, cancellationToken);

		return createdUser;
	}

	/// <summary>
	/// Generates authentication result with access and refresh tokens.
	/// </summary>
	/// <param name="user">
	/// The authenticated user for whom to generate tokens.
	/// </param>
	/// <param name="clientIp">
	/// The client IP address for audit and token generation.
	/// </param>
	/// <param name="requiresPasswordChange">
	/// Whether the user must change their password on next login.
	/// </param>
	/// <param name="rememberMe">
	/// Whether refresh token should use 'remember me' longer expiration.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// An <see cref="AuthResult"/> containing tokens and metadata.
	/// </returns>
	public virtual async Task<AuthResult> GenerateAuthResultAsync(
		User user,
		string? clientIp,
		bool requiresPasswordChange,
		bool rememberMe,
		CancellationToken cancellationToken)
	{
		// Get user roles
		IEnumerable<string> roles =
			await userQueryRepository.GetUserRolesAsync(
				user.Id,
				cancellationToken);

		string accessToken =
			tokenService.GenerateAccessToken(
				user.Id,
				user.Username,
				roles.ToList());

		string refreshToken =
			await tokenService.GenerateRefreshTokenAsync(
				user.Id,
				clientIp,
				rememberMe,
				cancellationToken);

		return AuthResult.Succeeded(
			accessToken,
			refreshToken,
			timeProvider
				.GetUtcNow()
				.AddMinutes(jwtSettings.Value.AccessTokenExpirationMinutes)
				.UtcDateTime,
			user.Email,
			user.FullName,
			requiresPasswordChange);
	}
}