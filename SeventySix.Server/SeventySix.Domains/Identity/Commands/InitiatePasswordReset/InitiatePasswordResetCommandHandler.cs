// <copyright file="InitiatePasswordResetCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Security.Cryptography;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Shared.Extensions;
using Wolverine;

namespace SeventySix.Identity;

/// <summary>
/// Handler for initiating a password reset.
/// </summary>
public static class InitiatePasswordResetCommandHandler
{
	/// <summary>
	/// Handles the initiate password reset command.
	/// </summary>
	/// <param name="command">
	/// The initiate password reset command containing user id and flags.
	/// </param>
	/// <param name="passwordResetTokenRepository">
	/// Repository to create and manage password reset tokens.
	/// </param>
	/// <param name="messageBus">
	/// Message bus for querying user details.
	/// </param>
	/// <param name="emailService">
	/// Service to send password reset or welcome emails.
	/// </param>
	/// <param name="jwtSettings">
	/// JWT-related settings used to compute expiration.
	/// </param>
	/// <param name="timeProvider">
	/// Time provider for current time values.
	/// </param>
	/// <param name="logger">
	/// Logger instance.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// </returns>
	/// <exception cref="InvalidOperationException">Thrown when user not found or inactive.</exception>
	public static async Task HandleAsync(
		InitiatePasswordResetCommand command,
		IPasswordResetTokenRepository passwordResetTokenRepository,
		IMessageBus messageBus,
		IEmailService emailService,
		IOptions<JwtSettings> jwtSettings,
		TimeProvider timeProvider,
		ILogger<InitiatePasswordResetCommand> logger,
		CancellationToken cancellationToken)
	{
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		UserDto? user =
			await messageBus.InvokeAsync<UserDto?>(
				new GetUserByIdQuery(command.UserId),
				cancellationToken);

		if (user is null || !user.IsActive)
		{
			logger.LogError(
				"User with ID {UserId} not found or inactive",
				command.UserId);
			throw new InvalidOperationException(
				$"User with ID {command.UserId} not found or inactive");
		}

		await passwordResetTokenRepository.InvalidateAllUserTokensAsync(
			command.UserId,
			now,
			cancellationToken);

		byte[] tokenBytes =
			RandomNumberGenerator.GetBytes(64);
		string rawToken =
			Convert.ToBase64String(tokenBytes);

		string tokenHash =
			CryptoExtensions.ComputeSha256Hash(rawToken);

		PasswordResetToken resetToken =
			new()
			{
				UserId = command.UserId,
				TokenHash = tokenHash,
				ExpiresAt =
					now.AddMinutes(
						jwtSettings.Value.RefreshTokenExpirationDays * 24 * 60),
				IsUsed = false,
				CreateDate = now,
			};

		await passwordResetTokenRepository.CreateAsync(
			resetToken,
			cancellationToken);

		if (command.IsNewUser)
		{
			await emailService.SendWelcomeEmailAsync(
				user.Email,
				user.Username,
				rawToken,
				cancellationToken);
		}
		else
		{
			await emailService.SendPasswordResetEmailAsync(
				user.Email,
				user.Username,
				rawToken,
				cancellationToken);
		}
	}
}