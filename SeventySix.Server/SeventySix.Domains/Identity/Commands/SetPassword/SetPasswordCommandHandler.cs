// <copyright file="SetPasswordCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using SeventySix.Shared.Interfaces;
using Wolverine;

namespace SeventySix.Identity;

/// <summary>
/// Handler for setting password using a reset token.
/// </summary>
public static class SetPasswordCommandHandler
{
	/// <summary>
	/// Handles the set password command using Identity's token-based password reset.
	/// </summary>
	/// <param name="command">
	/// The set password command containing token and new password.
	/// </param>
	/// <param name="userManager">
	/// Identity <see cref="UserManager{TUser}"/> for password operations.
	/// </param>
	/// <param name="tokenRepository">
	/// Repository for refresh tokens.
	/// </param>
	/// <param name="authenticationService">
	/// Service to generate authentication results.
	/// </param>
	/// <param name="cacheInvalidation">
	/// Cache invalidation service for clearing user cache.
	/// </param>
	/// <param name="breachCheck">
	/// Compound dependency for breach checking (service + settings).
	/// </param>
	/// <param name="timeProvider">
	/// Time provider for current time values.
	/// </param>
	/// <param name="logger">
	/// Logger instance for audit and errors.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// An <see cref="AuthResult"/> indicating success or failure.
	/// </returns>
	/// <exception cref="ArgumentException">
	/// Thrown when validation fails.
	/// </exception>
	/// <exception cref="InvalidOperationException">
	/// Thrown when user not found or inactive.
	/// </exception>
	public static async Task<AuthResult> HandleAsync(
		SetPasswordCommand command,
		UserManager<ApplicationUser> userManager,
		ITokenRepository tokenRepository,
		AuthenticationService authenticationService,
		ICacheInvalidationService cacheInvalidation,
		BreachCheckDependencies breachCheck,
		TimeProvider timeProvider,
		ILogger<SetPasswordCommand> logger,
		CancellationToken cancellationToken)
	{
		// Check new password against known breaches (OWASP ASVS V2.1.7)
		AuthResult? breachError =
			await breachCheck.ValidatePasswordNotBreachedAsync(
				command.Request.NewPassword,
				logger,
				"Password reset",
				cancellationToken);

		if (breachError is not null)
		{
			return breachError;
		}

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		// Parse the token to extract user ID and actual token
		// Token format: {userId}:{resetToken}
		string[] tokenParts =
			command.Request.Token.Split(':', 2);

		if (tokenParts.Length != 2)
		{
			logger.LogWarning("Invalid password reset token format");
			throw new ArgumentException(
				"Invalid or expired password reset token",
				"Token");
		}

		string userIdString =
			tokenParts[0];
		string resetToken =
			tokenParts[1];

		if (!long.TryParse(
			userIdString,
			out long userId))
		{
			logger.LogWarning("Invalid user ID in password reset token");
			throw new ArgumentException(
				"Invalid or expired password reset token",
				"Token");
		}

		ApplicationUser? user =
			await userManager.FindByIdAsync(
				userId.ToString());

		if (!user.IsValidForAuthentication())
		{
			logger.LogWarning(
				"User with ID {UserId} not found or inactive for password reset",
				userId);
			throw new InvalidOperationException(
				$"User with ID {userId} not found or inactive");
		}

		// Use Identity's ResetPasswordAsync with the token
		IdentityResult result =
			await userManager.ResetPasswordAsync(
				user,
				resetToken,
				command.Request.NewPassword);

		if (!result.Succeeded)
		{
			if (result.Errors.Any(error =>
				error.Code == "InvalidToken"))
			{
				logger.LogWarning(
					"Invalid or expired password reset token for user {UserId}",
					userId);
				throw new ArgumentException(
					"Invalid or expired password reset token",
					"Token");
			}

			throw new InvalidOperationException(
				string.Join(
					", ",
					result.Errors.Select(error => error.Description)));
		}

		// Revoke all existing refresh tokens
		await tokenRepository.RevokeAllUserTokensAsync(
			user.Id,
			now,
			cancellationToken);

		// Clear the requires-password-change flag and persist the update
		if (user.RequiresPasswordChange)
		{
			user.RequiresPasswordChange = false;
			await userManager.UpdateAsync(user);
		}

		// Invalidate user cache (profile contains hasPassword flag)
		await cacheInvalidation.InvalidateUserPasswordCacheAsync(user.Id);

		return await authenticationService.GenerateAuthResultAsync(
			user,
			command.ClientIp,
			requiresPasswordChange: false,
			rememberMe: false,
			cancellationToken);
	}
}