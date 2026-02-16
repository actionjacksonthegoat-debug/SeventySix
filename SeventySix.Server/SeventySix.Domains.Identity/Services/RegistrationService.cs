// <copyright file="RegistrationService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using SeventySix.Shared.Exceptions;

namespace SeventySix.Identity;

/// <summary>
/// Service for handling user registration operations.
/// </summary>
/// <remarks>
/// Encapsulates complex registration workflows including user creation,
/// credential setup, role assignment, and token generation.
/// Uses ASP.NET Core Identity UserManager for user operations.
/// Delegates token generation to <see cref="AuthenticationService"/> for DRY compliance.
/// </remarks>
/// <param name="userManager">
/// The UserManager for ApplicationUser.
/// </param>
/// <param name="authenticationService">
/// The authentication service for generating auth tokens (DRY - single source of truth).
/// </param>
/// <param name="timeProvider">
/// The time provider for current time.
/// </param>
/// <param name="logger">
/// The logger instance.
/// </param>
public sealed class RegistrationService(
	UserManager<ApplicationUser> userManager,
	AuthenticationService authenticationService,
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
		DateTimeOffset now =
			timeProvider.GetUtcNow();

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
			await userManager.CreateAsync(
				newUser,
				password);

		if (!createResult.Succeeded)
		{
			string errors = createResult.ToErrorString();
			logger.LogWarning(
				"Failed to create user '{Username}': {Errors}",
				username,
				errors);
			throw new DomainException(
				"User registration could not be completed.");
		}

		IdentityResult roleResult =
			await userManager.AddToRoleAsync(
				newUser,
				roleName);

		if (!roleResult.Succeeded)
		{
			string errors = roleResult.ToErrorString();
			logger.LogWarning(
				"Failed to assign role '{RoleName}' to user '{Username}': {Errors}",
				roleName,
				username,
				errors);
			throw new DomainException(
				"User registration could not be completed.");
		}

		return newUser;
	}

	/// <summary>
	/// Generates authentication result with access and refresh tokens.
	/// </summary>
	/// <remarks>
	/// Delegates to <see cref="AuthenticationService"/> for DRY compliance.
	/// All token generation logic is centralized in AuthenticationService.
	/// </remarks>
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
	public Task<AuthResult> GenerateAuthResultAsync(
		ApplicationUser user,
		string? clientIp,
		bool requiresPasswordChange,
		bool rememberMe,
		CancellationToken cancellationToken)
	{
		// Delegate to AuthenticationService (DRY - single source of truth)
		return authenticationService.GenerateAuthResultAsync(
			user,
			clientIp,
			requiresPasswordChange,
			rememberMe,
			cancellationToken);
	}
}