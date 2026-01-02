// <copyright file="RegistrationService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace SeventySix.Identity;

/// <summary>
/// Service for handling user registration operations.
/// </summary>
/// <remarks>
/// Encapsulates complex registration workflows including user creation,
/// credential setup, role assignment, and token generation.
/// Uses ASP.NET Core Identity UserManager for user operations.
/// </remarks>
/// <param name="userManager">
/// The UserManager for ApplicationUser.
/// </param>
/// <param name="tokenService">
/// The token service for generating auth tokens.
/// </param>
/// <param name="authRepository">
/// The authentication repository for user data operations.
/// </param>
/// <param name="jwtSettings">
/// The JWT settings options.
/// </param>
/// <param name="timeProvider">
/// The time provider for current time.
/// </param>
/// <param name="logger">
/// The logger instance.
/// </param>
public class RegistrationService(
	UserManager<ApplicationUser> userManager,
	ITokenService tokenService,
	IAuthRepository authRepository,
	IOptions<JwtSettings> jwtSettings,
	TimeProvider timeProvider,
	ILogger<RegistrationService> logger)
{
	/// <summary>
	/// Creates a user with password and role assignment.
	/// </summary>
	/// <remarks>
	/// Uses ASP.NET Core Identity UserManager for user creation.
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
	/// <param name="roleName">
	/// Role name to assign to the new user.
	/// </param>
	/// <returns>
	/// The created <see cref="ApplicationUser"/> with ID populated.
	/// </returns>
	public async Task<ApplicationUser> CreateUserWithCredentialAsync(
		string username,
		string email,
		string? fullName,
		string password,
		string createdBy,
		string roleName)
	{
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		ApplicationUser newUser =
			new()
			{
				UserName = username,
				Email = email,
				FullName = fullName,
				IsActive = true,
				CreateDate = now,
				CreatedBy = createdBy,
			};

		IdentityResult createResult =
			await userManager.CreateAsync(newUser, password);

		if (!createResult.Succeeded)
		{
			string errors = createResult.ToErrorString();
			logger.LogError(
				"Failed to create user '{Username}': {Errors}",
				username,
				errors);
			throw new InvalidOperationException($"Failed to create user: {errors}");
		}

		IdentityResult roleResult =
			await userManager.AddToRoleAsync(newUser, roleName);

		if (!roleResult.Succeeded)
		{
			string errors = roleResult.ToErrorString();
			logger.LogError(
				"Failed to assign role '{RoleName}' to user '{Username}': {Errors}",
				roleName,
				username,
				errors);
			throw new InvalidOperationException($"Failed to assign role: {errors}");
		}

		return newUser;
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
		ApplicationUser user,
		string? clientIp,
		bool requiresPasswordChange,
		bool rememberMe,
		CancellationToken cancellationToken)
	{
		// Get user roles
		IList<string> roles =
			await userManager.GetRolesAsync(user);

		string accessToken =
			tokenService.GenerateAccessToken(
				user.Id,
				user.UserName ?? string.Empty,
				[.. roles]);

		string refreshToken =
			await tokenService.GenerateRefreshTokenAsync(
				user.Id,
				clientIp,
				rememberMe,
				cancellationToken);

		await authRepository.UpdateLastLoginAsync(
			user.Id,
			timeProvider.GetUtcNow().UtcDateTime,
			clientIp,
			cancellationToken);

		return AuthResult.Succeeded(
			accessToken,
			refreshToken,
			timeProvider
				.GetUtcNow()
				.AddMinutes(jwtSettings.Value.AccessTokenExpirationMinutes)
				.UtcDateTime,
			user.Email ?? string.Empty,
			user.FullName,
			requiresPasswordChange);
	}
}