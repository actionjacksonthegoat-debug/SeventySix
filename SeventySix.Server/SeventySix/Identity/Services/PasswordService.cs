// <copyright file="PasswordService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Security.Cryptography;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Identity.Extensions;

namespace SeventySix.Identity;

/// <summary>
/// Password management service.
/// </summary>
/// <remarks>
/// Handles password change, reset, and set operations.
/// Extracted from AuthService following SRP - focused solely on password management.
/// </remarks>
public class PasswordService(
	IdentityDbContext context,
	ITokenService tokenService,
	IOptions<AuthSettings> authSettings,
	IOptions<JwtSettings> jwtSettings,
	IValidator<ChangePasswordRequest> changePasswordValidator,
	IValidator<SetPasswordRequest> setPasswordValidator,
	IEmailService emailService,
	TimeProvider timeProvider,
	ILogger<PasswordService> logger) : IPasswordService
{
	/// <inheritdoc/>
	public async Task<AuthResult> ChangePasswordAsync(
		int userId,
		ChangePasswordRequest request,
		CancellationToken cancellationToken = default)
	{
		// Validate password requirements
		ValidationResult validationResult =
			await changePasswordValidator.ValidateAsync(request, cancellationToken);

		if (!validationResult.IsValid)
		{
			return AuthResult.Failed(
				validationResult.ToErrorMessage(),
				"VALIDATION_ERROR");
		}

		UserCredential? credential =
			await context.UserCredentials
				.Where(c => c.UserId == userId)
				.FirstOrDefaultAsync(cancellationToken);

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		if (credential != null)
		{
			// Verify current password if user has one
			if (request.CurrentPassword == null
				|| !BCrypt.Net.BCrypt.Verify(
					request.CurrentPassword,
					credential.PasswordHash))
			{
				return AuthResult.Failed(
					"Current password is incorrect.",
					"INVALID_PASSWORD");
			}

			credential.PasswordHash =
				BCrypt.Net.BCrypt.HashPassword(
					request.NewPassword,
					authSettings.Value.Password.WorkFactor);
			credential.PasswordChangedAt = now;
		}
		else
		{
			// Create credential for OAuth-only user
			credential =
				new UserCredential
				{
					UserId = userId,
					PasswordHash =
						BCrypt.Net.BCrypt.HashPassword(
							request.NewPassword,
							authSettings.Value.Password.WorkFactor),
					CreateDate = now
				};

			context.UserCredentials.Add(credential);
		}

		await context.SaveChangesAsync(cancellationToken);

		// Revoke all tokens to require re-login
		await tokenService.RevokeAllUserTokensAsync(
			userId,
			cancellationToken);

		return AuthResult.Succeeded();
	}

	/// <inheritdoc/>
	public async Task InitiatePasswordResetAsync(
		int userId,
		bool isNewUser,
		CancellationToken cancellationToken = default)
	{
		User user =
			await context.Users
				.AsNoTracking()
				.Where(u => u.Id == userId)
				.FirstOrDefaultAsync(cancellationToken)
			?? throw new InvalidOperationException($"User with ID {userId} not found.");

		// Invalidate any existing unused tokens for this user
		await context.PasswordResetTokens
			.Where(t => t.UserId == userId && !t.IsUsed)
			.ExecuteUpdateAsync(
				setters => setters.SetProperty(t => t.IsUsed, true),
				cancellationToken);

		// Generate secure token
		byte[] tokenBytes =
			RandomNumberGenerator.GetBytes(64);
		string token =
			Convert.ToBase64String(tokenBytes);

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		PasswordResetToken resetToken =
			new()
			{
				UserId = userId,
				Token = token,
				ExpiresAt = now.AddHours(24),
				CreateDate = now,
				IsUsed = false,
			};

		context.PasswordResetTokens.Add(resetToken);
		await context.SaveChangesAsync(cancellationToken);

		// Send appropriate email
		if (isNewUser)
		{
			await emailService.SendWelcomeEmailAsync(
				user.Email,
				user.Username,
				token,
				cancellationToken);
		}
		else
		{
			await emailService.SendPasswordResetEmailAsync(
				user.Email,
				user.Username,
				token,
				cancellationToken);
		}
	}

	/// <inheritdoc/>
	public async Task InitiatePasswordResetByEmailAsync(
		string email,
		CancellationToken cancellationToken = default)
	{
		User? user =
			await context.Users
				.AsNoTracking()
				.Where(user => user.Email.ToLower() == email.ToLower()
					&& user.IsActive)
				.FirstOrDefaultAsync(cancellationToken);

		// Silent success for non-existent/inactive emails (prevents enumeration)
		if (user == null)
		{
			return;
		}

		await InitiatePasswordResetAsync(
			user.Id,
			isNewUser: false,
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<AuthResult> SetPasswordAsync(
		SetPasswordRequest request,
		string? clientIp,
		CancellationToken cancellationToken = default)
	{
		// Validate request
		ValidationResult validationResult =
			await setPasswordValidator.ValidateAsync(request, cancellationToken);

		if (!validationResult.IsValid)
		{
			string errorMessage =
				string.Join(" ", validationResult.Errors.Select(e => e.ErrorMessage));

			return AuthResult.Failed(
				errorMessage,
				"VALIDATION_ERROR");
		}

		// Find the token
		PasswordResetToken? resetToken =
			await context.PasswordResetTokens
				.Where(t => t.Token == request.Token)
				.FirstOrDefaultAsync(cancellationToken);

		if (resetToken == null)
		{
			logger.LogWarning("Invalid password reset token attempted.");
			return AuthResult.Failed(
				"Invalid or expired reset token.",
				AuthErrorCodes.InvalidToken);
		}

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		if (resetToken.IsUsed)
		{
			logger.LogWarning(
				"Attempted to use already-used reset token. UserId: {UserId}",
				resetToken.UserId);
			return AuthResult.Failed(
				"This reset link has already been used.",
				AuthErrorCodes.TokenExpired);
		}

		if (resetToken.ExpiresAt < now)
		{
			logger.LogWarning(
				"Attempted to use expired reset token. UserId: {UserId}, ExpiredAt: {ExpiredAt}",
				resetToken.UserId,
				resetToken.ExpiresAt);
			return AuthResult.Failed(
				"This reset link has expired.",
				AuthErrorCodes.TokenExpired);
		}

		// Get the user
		User? user =
			await context.Users
				.Where(u => u.Id == resetToken.UserId)
				.FirstOrDefaultAsync(cancellationToken);

		if (user == null)
		{
			logger.LogError(
				"User not found for valid reset token. UserId: {UserId}",
				resetToken.UserId);
			return AuthResult.Failed(
				"User not found.",
				AuthErrorCodes.UserNotFound);
		}

		// Mark token as used
		resetToken.IsUsed = true;

		// Update or create credential
		UserCredential? credential =
			await context.UserCredentials
				.Where(c => c.UserId == user.Id)
				.FirstOrDefaultAsync(cancellationToken);

		if (credential != null)
		{
			credential.PasswordHash =
				BCrypt.Net.BCrypt.HashPassword(
					request.NewPassword,
					authSettings.Value.Password.WorkFactor);
			credential.PasswordChangedAt = now;
		}
		else
		{
			credential =
				new UserCredential
				{
					UserId = user.Id,
					PasswordHash =
						BCrypt.Net.BCrypt.HashPassword(
							request.NewPassword,
							authSettings.Value.Password.WorkFactor),
					CreateDate = now
				};

			context.UserCredentials.Add(credential);
		}

		await context.SaveChangesAsync(cancellationToken);

		// Revoke all existing tokens
		await tokenService.RevokeAllUserTokensAsync(
			user.Id,
			cancellationToken);

		// Generate new auth tokens for immediate login
		return await GenerateAuthResultAsync(
			user,
			clientIp,
			requiresPasswordChange: false,
			rememberMe: false,
			cancellationToken);
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