// <copyright file="RegistrationService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Security.Cryptography;
using FluentValidation;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Identity.Constants;
using SeventySix.Shared;

namespace SeventySix.Identity;

/// <summary>
/// User registration service.
/// </summary>
/// <remarks>
/// Handles direct registration and email verification flows.
/// Extracted from AuthService following SRP - focused solely on registration.
/// DIP compliant: Depends on repository abstractions, not DbContext.
/// </remarks>
public class RegistrationService(
	IUserValidationRepository userValidationRepository,
	IUserRoleRepository userRoleRepository,
	IAuthRepository authRepository,
	ICredentialRepository credentialRepository,
	IEmailVerificationTokenRepository emailVerificationTokenRepository,
	ITokenService tokenService,
	IOptions<AuthSettings> authSettings,
	IOptions<JwtSettings> jwtSettings,
	IValidator<InitiateRegistrationRequest> initiateRegistrationValidator,
	IValidator<CompleteRegistrationRequest> completeRegistrationValidator,
	IEmailService emailService,
	TimeProvider timeProvider,
	ITransactionManager transactionManager,
	ILogger<RegistrationService> logger) : IRegistrationService
{
	/// <inheritdoc/>
	public async Task<AuthResult> RegisterAsync(
		RegisterRequest request,
		string? clientIp,
		CancellationToken cancellationToken = default)
	{
		// Check for existing username
		bool usernameExists = await userValidationRepository.UsernameExistsAsync(
			request.Username,
			excludeId: null,
			cancellationToken);

		if (usernameExists)
		{
			return AuthResult.Failed(
				"Username is already taken.",
				AuthErrorCodes.UsernameExists);
		}

		// Check for existing email
		bool emailExists = await userValidationRepository.EmailExistsAsync(
			request.Email,
			excludeId: null,
			cancellationToken);

		if (emailExists)
		{
			return AuthResult.Failed(
				"Email is already registered.",
				AuthErrorCodes.EmailExists);
		}

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		// Get role ID before creating entities (read-only query)
		int userRoleId =
			await GetRoleIdByNameAsync(
				RoleConstants.User,
				cancellationToken);

		// Create user with credential and role atomically
		User user =
			await transactionManager.ExecuteInTransactionAsync(
				async transactionCancellationToken =>
				{
					User createdUser = await CreateUserWithCredentialAsync(
						request.Username,
						request.Email,
						request.FullName,
						request.Password,
						"Registration",
						userRoleId,
						requiresPasswordChange: true,
						now,
						transactionCancellationToken);

					return createdUser;
				},
				cancellationToken: cancellationToken);

		return await GenerateAuthResultAsync(
			user,
			clientIp,
			requiresPasswordChange: false,
			rememberMe: false,
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task InitiateRegistrationAsync(
		InitiateRegistrationRequest request,
		CancellationToken cancellationToken = default)
	{
		await initiateRegistrationValidator.ValidateAndThrowAsync(
			request,
			cancellationToken);

		string email =
			request.Email;

		// Check if email is already registered
		bool emailExists = await userValidationRepository.EmailExistsAsync(
			email,
			excludeId: null,
			cancellationToken);

		if (emailExists)
		{
			return; // Silent success to prevent enumeration
		}

		// Invalidate any existing verification tokens for this email
		await emailVerificationTokenRepository.InvalidateTokensForEmailAsync(
			email,
			cancellationToken);

		// Generate new verification token
		byte[] tokenBytes =
			RandomNumberGenerator.GetBytes(64);
		string token =
			Convert.ToBase64String(tokenBytes);

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		EmailVerificationToken verificationToken =
			new()
			{
				Email = email,
				Token = token,
				ExpiresAt = now.AddHours(24),
				CreateDate = now,
				IsUsed = false,
			};

		await emailVerificationTokenRepository.CreateAsync(
			verificationToken,
			cancellationToken);

		// Send verification email
		await emailService.SendVerificationEmailAsync(
			email,
			token,
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<AuthResult> CompleteRegistrationAsync(
		CompleteRegistrationRequest request,
		string? clientIp,
		CancellationToken cancellationToken = default)
	{
		await completeRegistrationValidator.ValidateAndThrowAsync(
			request,
			cancellationToken);

		// Find the verification token
		EmailVerificationToken? verificationToken = await emailVerificationTokenRepository.GetByTokenAsync(
			request.Token,
			cancellationToken);

		if (verificationToken == null)
		{
			logger.LogWarning("Invalid email verification token attempted.");
			return AuthResult.Failed(
				"Invalid or expired verification link.",
				AuthErrorCodes.InvalidToken);
		}

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		if (verificationToken.IsUsed)
		{
			logger.LogWarning(
				"Attempted to use already-used verification token. Email: {Email}",
				verificationToken.Email);
			return AuthResult.Failed(
				"This verification link has already been used.",
				AuthErrorCodes.TokenExpired);
		}

		if (verificationToken.ExpiresAt < now)
		{
			logger.LogWarning(
				"Attempted to use expired verification token. Email: {Email}, ExpiredAt: {ExpiredAt}",
				verificationToken.Email,
				verificationToken.ExpiresAt);
			return AuthResult.Failed(
				"This verification link has expired. Please request a new one.",
				AuthErrorCodes.TokenExpired);
		}

		// Check if username already exists
		bool usernameExists = await userValidationRepository.UsernameExistsAsync(
			request.Username,
			excludeId: null,
			cancellationToken);

		if (usernameExists)
		{
			logger.LogWarning(
				"Registration attempt with existing username: {Username}",
				request.Username);
			return AuthResult.Failed(
				"Username is already taken.",
				AuthErrorCodes.UsernameExists);
		}

		// Double-check email isn't already registered (race condition protection)
		bool emailExists = await userValidationRepository.EmailExistsAsync(
			verificationToken.Email,
			excludeId: null,
			cancellationToken);

		if (emailExists)
		{
			logger.LogWarning(
				"Registration attempt with already registered email: {Email}",
				verificationToken.Email);
			return AuthResult.Failed(
				"This email is already registered.",
				AuthErrorCodes.EmailExists);
		}

		// Get role ID before creating entities (read-only query)
		int userRoleId =
			await GetRoleIdByNameAsync(
				RoleConstants.User,
				cancellationToken);

		// Create user with credential and role atomically
		User user =
			await transactionManager.ExecuteInTransactionAsync(
				async transactionCancellationToken =>
				{
					User createdUser = await CreateUserWithCredentialAsync(
						request.Username,
						verificationToken.Email,
						fullName: null,
						request.Password,
						"Self-Registration",
						userRoleId,
						requiresPasswordChange: false,
						now,
						transactionCancellationToken);

					// Mark token as used
					verificationToken.IsUsed = true;
					await emailVerificationTokenRepository.SaveChangesAsync(
						verificationToken,
						transactionCancellationToken);

					return createdUser;
				},
				cancellationToken: cancellationToken);

		return await GenerateAuthResultAsync(
			user,
			clientIp,
			requiresPasswordChange: false,
			rememberMe: false,
			cancellationToken);
	}

	/// <summary>
	/// Gets the role ID by name.
	/// </summary>
	/// <param name="roleName">The role name to look up.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The role ID.</returns>
	/// <exception cref="InvalidOperationException">Thrown if role not found.</exception>
	private async Task<int> GetRoleIdByNameAsync(
		string roleName,
		CancellationToken cancellationToken)
	{
		int? roleId = await authRepository.GetRoleIdByNameAsync(
			roleName,
			cancellationToken);

		if (roleId is null)
		{
			throw new InvalidOperationException($"Role '{roleName}' not found in SecurityRoles");
		}

		return roleId.Value;
	}

	/// <summary>
	/// Creates a user with credential and role assignment.
	/// </summary>
	/// <remarks>Must be called within a transaction.</remarks>
	private async Task<User> CreateUserWithCredentialAsync(
		string username,
		string email,
		string? fullName,
		string password,
		string createdBy,
		int roleId,
		bool requiresPasswordChange,
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

		User createdUser = await authRepository.CreateUserWithRoleAsync(
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
	private async Task<AuthResult> GenerateAuthResultAsync(
		User user,
		string? clientIp,
		bool requiresPasswordChange,
		bool rememberMe,
		CancellationToken cancellationToken)
	{
		// Get user roles
		IEnumerable<string> roles = await userRoleRepository.GetUserRolesAsync(
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