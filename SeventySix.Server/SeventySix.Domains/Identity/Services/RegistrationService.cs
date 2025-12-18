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
	/// <remarks>Must be called within a transaction.</remarks>
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