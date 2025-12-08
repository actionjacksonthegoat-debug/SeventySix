// <copyright file="PasswordService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Security.Cryptography;
using FluentValidation;
using FluentValidation.Results;
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
/// DIP compliant: Depends on repository abstractions, not DbContext.
/// </remarks>
public class PasswordService(
	ICredentialRepository credentialRepository,
	IPasswordResetTokenRepository passwordResetTokenRepository,
	IUserQueryRepository userQueryRepository,
	IUserRoleRepository userRoleRepository,
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

		UserCredential? credential = await credentialRepository.GetByUserIdForUpdateAsync(
			userId,
			cancellationToken);

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

			await credentialRepository.UpdateAsync(
				credential,
				cancellationToken);
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

			await credentialRepository.CreateAsync(
				credential,
				cancellationToken);
		}

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
		User user = await userQueryRepository.GetByIdAsync(
			userId,
			cancellationToken)
			?? throw new InvalidOperationException($"User with ID {userId} not found.");

		// Invalidate any existing unused tokens for this user
		await passwordResetTokenRepository.InvalidateAllUserTokensAsync(
			userId,
			timeProvider.GetUtcNow().UtcDateTime,
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

		await passwordResetTokenRepository.CreateAsync(
			resetToken,
			cancellationToken);

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
		User? user = await userQueryRepository.GetByEmailAsync(
			email,
			cancellationToken);

		// Silent success for non-existent/inactive emails (prevents enumeration)
		if (user == null || !user.IsActive)
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
				string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage));

			return AuthResult.Failed(
				errorMessage,
				"VALIDATION_ERROR");
		}

		// Find the token
		PasswordResetToken? resetToken = await passwordResetTokenRepository.GetByHashAsync(
			request.Token,
			cancellationToken);

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
		User? user = await userQueryRepository.GetByIdAsync(
			resetToken.UserId,
			cancellationToken);

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
		await passwordResetTokenRepository.MarkAsUsedAsync(
			resetToken,
			cancellationToken);

		// Update or create credential
		UserCredential? credential = await credentialRepository.GetByUserIdForUpdateAsync(
			user.Id,
			cancellationToken);

		if (credential != null)
		{
			credential.PasswordHash =
				BCrypt.Net.BCrypt.HashPassword(
					request.NewPassword,
					authSettings.Value.Password.WorkFactor);
			credential.PasswordChangedAt = now;

			await credentialRepository.UpdateAsync(
				credential,
				cancellationToken);
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

			await credentialRepository.CreateAsync(
				credential,
				cancellationToken);
		}

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