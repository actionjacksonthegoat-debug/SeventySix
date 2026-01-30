// <copyright file="MfaService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using SeventySix.Shared.Extensions;

namespace SeventySix.Identity;

/// <summary>
/// Service for MFA code generation and verification.
/// </summary>
/// <param name="settings">
/// MFA configuration settings.
/// </param>
/// <param name="challengeRepository">
/// Repository for challenge persistence.
/// </param>
/// <param name="userManager">
/// Identity user manager for user lookups.
/// </param>
/// <param name="timeProvider">
/// Time provider for timestamps.
/// </param>
public sealed class MfaService(
	IOptions<MfaSettings> settings,
	IMfaChallengeRepository challengeRepository,
	UserManager<ApplicationUser> userManager,
	TimeProvider timeProvider)
	: IMfaService
{
	/// <inheritdoc/>
	public string GenerateCode()
	{
		Span<byte> randomBytes =
			stackalloc byte[4];
		RandomNumberGenerator.Fill(randomBytes);

		int randomValue =
			BitConverter.ToInt32(randomBytes) & int.MaxValue;
		int maxValue =
			(int)Math.Pow(10, settings.Value.CodeLength);

		string code =
			(randomValue % maxValue)
				.ToString()
				.PadLeft(settings.Value.CodeLength, '0');

		return code;
	}

	/// <inheritdoc/>
	public async Task<(string ChallengeToken, string Code)> CreateChallengeAsync(
		long userId,
		string? clientIp,
		CancellationToken cancellationToken)
	{
		string code =
			GenerateCode();
		string codeHash =
			CryptoExtensions.ComputeSha256Hash(
				code,
				useLowercase: true);
		string challengeToken =
			Guid.NewGuid().ToString("N");

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		MfaChallenge challenge =
			new()
			{
				Token = challengeToken,
				UserId = userId,
				CodeHash = codeHash,
				ExpiresAt = now.AddMinutes(settings.Value.CodeExpirationMinutes),
				Attempts = 0,
				IsUsed = false,
				ClientIp = clientIp,
				CreateDate = now
			};

		await challengeRepository.CreateAsync(
			challenge,
			cancellationToken);

		return (challengeToken, code);
	}

	/// <inheritdoc/>
	public async Task<MfaVerificationResult> VerifyCodeAsync(
		string challengeToken,
		string code,
		CancellationToken cancellationToken)
	{
		MfaChallenge? challenge =
			await challengeRepository.GetByTokenAsync(
				challengeToken,
				cancellationToken);

		if (challenge is null)
		{
			return MfaVerificationResult.Failed(
				userId: 0,
				"Invalid or expired challenge",
				MfaErrorCodes.InvalidChallenge);
		}

		if (challenge.IsUsed)
		{
			return MfaVerificationResult.Failed(
				challenge.UserId,
				"Challenge has already been used",
				MfaErrorCodes.ChallengeUsed);
		}

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		if (challenge.ExpiresAt < now)
		{
			return MfaVerificationResult.Failed(
				challenge.UserId,
				"Verification code has expired",
				MfaErrorCodes.CodeExpired);
		}

		if (challenge.Attempts >= settings.Value.MaxAttempts)
		{
			return MfaVerificationResult.Failed(
				challenge.UserId,
				"Too many verification attempts",
				MfaErrorCodes.TooManyAttempts);
		}

		string providedHash =
			CryptoExtensions.ComputeSha256Hash(
				code,
				useLowercase: true);

		// OWASP: Timing-safe comparison prevents timing attacks
		bool isValid =
			CryptographicOperations.FixedTimeEquals(
				Encoding.UTF8.GetBytes(challenge.CodeHash),
				Encoding.UTF8.GetBytes(providedHash));

		if (!isValid)
		{
			challenge.Attempts++;
			await challengeRepository.UpdateAsync(
				challenge,
				cancellationToken);

			return MfaVerificationResult.Failed(
				challenge.UserId,
				"Invalid verification code",
				MfaErrorCodes.InvalidCode);
		}

		challenge.IsUsed = true;
		await challengeRepository.UpdateAsync(
			challenge,
			cancellationToken);

		return MfaVerificationResult.Succeeded(challenge.UserId);
	}

	/// <inheritdoc/>
	public async Task<MfaChallengeRefreshResult> RefreshChallengeAsync(
		string challengeToken,
		CancellationToken cancellationToken)
	{
		MfaChallenge? challenge =
			await challengeRepository.GetByTokenAsync(
				challengeToken,
				cancellationToken);

		if (challenge is null)
		{
			return MfaChallengeRefreshResult.Failed(
				"Invalid challenge token",
				MfaErrorCodes.InvalidChallenge);
		}

		if (challenge.IsUsed)
		{
			return MfaChallengeRefreshResult.Failed(
				"Challenge has already been used",
				MfaErrorCodes.ChallengeUsed);
		}

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		// Check cooldown - cannot resend if created within cooldown period
		TimeSpan timeSinceCreation =
			now - challenge.CreateDate;
		if (timeSinceCreation.TotalSeconds < settings.Value.ResendCooldownSeconds)
		{
			return MfaChallengeRefreshResult.Failed(
				"Please wait before requesting a new code",
				MfaErrorCodes.ResendCooldown);
		}

		// Get user email for sending
		ApplicationUser? user =
			await userManager.FindByIdAsync(
				challenge.UserId.ToString());

		if (user is null)
		{
			return MfaChallengeRefreshResult.Failed(
				"User not found",
				MfaErrorCodes.InvalidChallenge);
		}

		// Generate new code and update challenge
		string newCode =
			GenerateCode();
		string newCodeHash =
			CryptoExtensions.ComputeSha256Hash(
				newCode,
				useLowercase: true);

		challenge.CodeHash =
			newCodeHash;
		challenge.CreateDate =
			now;
		challenge.ExpiresAt =
			now.AddMinutes(settings.Value.CodeExpirationMinutes);
		challenge.Attempts =
			0;

		await challengeRepository.UpdateAsync(
			challenge,
			cancellationToken);

		return MfaChallengeRefreshResult.Succeeded(
			challenge.UserId,
			user.Email ?? string.Empty,
			newCode);
	}
}