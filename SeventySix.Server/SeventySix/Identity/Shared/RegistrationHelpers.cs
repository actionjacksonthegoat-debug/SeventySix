// <copyright file="RegistrationHelpers.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Identity.Constants;

namespace SeventySix.Identity;

/// <summary>
/// Shared helper methods for registration command handlers.
/// </summary>
/// <remarks>
/// Extracted from handlers to follow DRY principle.
/// Used by RegisterCommandHandler and CompleteRegistrationCommandHandler.
/// </remarks>
public static class RegistrationHelpers
{
	/// <summary>
	/// Gets the role ID by name.
	/// </summary>
	/// <exception cref="InvalidOperationException">Thrown if role not found.</exception>
	public static async Task<int> GetRoleIdByNameAsync<TCommand>(
		IAuthRepository authRepository,
		string roleName,
		ILogger<TCommand> logger,
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
			throw new InvalidOperationException($"Role '{roleName}' not found in SecurityRoles");
		}

		return roleId.Value;
	}

	/// <summary>
	/// Creates a user with credential and role assignment.
	/// </summary>
	/// <remarks>Must be called within a transaction.</remarks>
	public static async Task<User> CreateUserWithCredentialAsync(
		IAuthRepository authRepository,
		ICredentialRepository credentialRepository,
		string username,
		string email,
		string? fullName,
		string password,
		string createdBy,
		int roleId,
		bool requiresPasswordChange,
		IOptions<AuthSettings> authSettings,
		DateTime now,
		CancellationToken cancellationToken)
	{
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
			BCrypt.Net.BCrypt.HashPassword(
				password,
				authSettings.Value.Password.WorkFactor);

		UserCredential credential =
			new()
			{
				UserId = createdUser.Id,
				PasswordHash = passwordHash,
				CreateDate = now,
				PasswordChangedAt = requiresPasswordChange ? null : now,
			};

		await credentialRepository.CreateAsync(
			credential,
			cancellationToken);

		return createdUser;
	}

	/// <summary>
	/// Generates authentication result with access and refresh tokens.
	/// </summary>
	public static async Task<AuthResult> GenerateAuthResultAsync(
		User user,
		string? clientIp,
		bool requiresPasswordChange,
		bool rememberMe,
		IUserRoleRepository userRoleRepository,
		ITokenService tokenService,
		IOptions<JwtSettings> jwtSettings,
		TimeProvider timeProvider,
		CancellationToken cancellationToken)
	{
		// Get user roles
		IEnumerable<string> roles =
			await userRoleRepository.GetUserRolesAsync(
				user.Id,
				cancellationToken);

		string accessToken =
			tokenService.GenerateAccessToken(
				user.Id,
				user.Username,
				user.Email,
				user.FullName,
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
			timeProvider.GetUtcNow().AddMinutes(jwtSettings.Value.AccessTokenExpirationMinutes).UtcDateTime,
			requiresPasswordChange);
	}
}