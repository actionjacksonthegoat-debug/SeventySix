// <copyright file="RegistrationService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Security.Cryptography;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
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
/// </remarks>
public class RegistrationService(
	IdentityDbContext context,
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
		bool usernameExists =
			await context.Users
				.AnyAsync(
					user => user.Username == request.Username,
					cancellationToken);

		if (usernameExists)
		{
			return AuthResult.Failed(
				"Username is already taken.",
				AuthErrorCodes.UsernameExists);
		}

		// Check for existing email
		bool emailExists =
			await context.Users
				.AnyAsync(
					user => user.Email == request.Email,
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
					User newUser =
						new()
						{
							Username = request.Username,
							Email = request.Email,
							FullName = request.FullName,
							IsActive = true,
							CreateDate = now,
							CreatedBy = "Registration"
						};

					context.Users.Add(newUser);

					// Save user first to get the ID
					await context.SaveChangesAsync(transactionCancellationToken);

					// Create credential with user ID
					string passwordHash =
						BCrypt.Net.BCrypt.HashPassword(
							request.Password,
							authSettings.Value.Password.WorkFactor);

					UserCredential credential =
						new()
						{
							UserId = newUser.Id,
							PasswordHash = passwordHash,
							CreateDate = now
						};

					context.UserCredentials.Add(credential);

					// Assign default role
					UserRole userRole =
						new()
						{
							UserId = newUser.Id,
							RoleId = userRoleId
						};

					context.UserRoles.Add(userRole);

					await context.SaveChangesAsync(transactionCancellationToken);

					return newUser;
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
		bool emailExists =
			await context.Users
				.AsNoTracking()
				.AnyAsync(
					user => user.Email.ToLower() == email.ToLower(),
					cancellationToken);

		if (emailExists)
		{
			return; // Silent success to prevent enumeration
		}

		// Invalidate any existing verification tokens for this email
		List<EmailVerificationToken> existingTokens =
			await context.EmailVerificationTokens
				.Where(token => token.Email.ToLower() == email.ToLower()
					&& !token.IsUsed)
				.ToListAsync(cancellationToken);

		foreach (EmailVerificationToken existingToken in existingTokens)
		{
			existingToken.IsUsed = true;
		}

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

		context.EmailVerificationTokens.Add(verificationToken);
		await context.SaveChangesAsync(cancellationToken);

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
		EmailVerificationToken? verificationToken =
			await context.EmailVerificationTokens
				.Where(token => token.Token == request.Token)
				.FirstOrDefaultAsync(cancellationToken);

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
		bool usernameExists =
			await context.Users
				.AsNoTracking()
				.AnyAsync(
					user => user.Username.ToLower() == request.Username.ToLower(),
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
		bool emailExists =
			await context.Users
				.AsNoTracking()
				.AnyAsync(
					user => user.Email.ToLower() == verificationToken.Email.ToLower(),
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
					User newUser =
						new()
						{
							Username = request.Username,
							Email = verificationToken.Email,
							IsActive = true,
							CreateDate = now,
							CreatedBy = "Self-Registration",
						};

					context.Users.Add(newUser);

					// Mark token as used
					verificationToken.IsUsed = true;

					// Save user first to get the ID
					await context.SaveChangesAsync(transactionCancellationToken);

					// Create credential with user ID
					string hashedPassword =
						BCrypt.Net.BCrypt.HashPassword(
							request.Password,
							authSettings.Value.Password.WorkFactor);

					UserCredential credential =
						new()
						{
							UserId = newUser.Id,
							PasswordHash = hashedPassword,
							CreateDate = now,
							PasswordChangedAt = now, // Set to now so no password change required
						};

					context.UserCredentials.Add(credential);

					// Assign default User role
					UserRole userRole =
						new()
						{
							UserId = newUser.Id,
							RoleId = userRoleId
						};

					context.UserRoles.Add(userRole);

					await context.SaveChangesAsync(transactionCancellationToken);

					return newUser;
				},
				cancellationToken: cancellationToken);

		// Generate tokens for immediate login
		List<string> roles =
			[RoleConstants.User];

		string accessToken =
			tokenService.GenerateAccessToken(
				user.Id,
				user.Username,
				user.Email,
				user.FullName,
				roles);

		string refreshToken =
			await tokenService.GenerateRefreshTokenAsync(
				user.Id,
				clientIp,
				rememberMe: false,
				cancellationToken);

		return AuthResult.Succeeded(
			accessToken,
			refreshToken,
			timeProvider.GetUtcNow().AddMinutes(jwtSettings.Value.AccessTokenExpirationMinutes).UtcDateTime,
			requiresPasswordChange: false);
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
		int? roleId =
			await context.SecurityRoles
				.Where(securityRole => securityRole.Name == roleName)
				.Select(securityRole => (int?)securityRole.Id)
				.FirstOrDefaultAsync(cancellationToken);

		if (roleId is null)
		{
			throw new InvalidOperationException($"Role '{roleName}' not found in SecurityRoles");
		}

		return roleId.Value;
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
		List<string> roles =
			await context.UserRoles
				.AsNoTracking()
				.Where(userRole => userRole.UserId == user.Id)
				.Join(
					context.SecurityRoles,
					userRole => userRole.RoleId,
					role => role.Id,
					(userRole, role) => role.Name)
				.ToListAsync(cancellationToken);

		string accessToken =
			tokenService.GenerateAccessToken(
				user.Id,
				user.Username,
				user.Email,
				user.FullName,
				roles);

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