// <copyright file="BackupCodeService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace SeventySix.Identity;

/// <summary>
/// Service for backup code generation and verification.
/// </summary>
/// <param name="context">
/// The Identity database context.
/// </param>
/// <param name="settings">
/// Backup code configuration settings.
/// </param>
/// <param name="passwordHasher">
/// Password hasher for secure code storage.
/// </param>
/// <param name="timeProvider">
/// Time provider for timestamps.
/// </param>
public sealed class BackupCodeService(
	IdentityDbContext context,
	IOptions<BackupCodeSettings> settings,
	IPasswordHasher<BackupCode> passwordHasher,
	TimeProvider timeProvider)
	: IBackupCodeService
{
	/// <inheritdoc/>
	public async Task<IReadOnlyList<string>> GenerateCodesAsync(
		long userId,
		CancellationToken cancellationToken)
	{
		// Delete existing backup codes for this user
		await context
			.BackupCodes
			.Where(code => code.UserId == userId)
			.ExecuteDeleteAsync(cancellationToken);

		List<string> plainCodes =
			[];
		DateTimeOffset now =
			timeProvider.GetUtcNow();

		for (int index = 0; index < settings.Value.CodeCount; index++)
		{
			string plainCode =
				GenerateRandomCode(settings.Value.CodeLength);

			BackupCode backupCode =
				new()
				{
					UserId = userId,
					CodeHash = passwordHasher.HashPassword(
						new BackupCode(),
						plainCode),
					IsUsed = false,
					CreateDate = now
				};

			context.BackupCodes.Add(backupCode);
			plainCodes.Add(plainCode);
		}

		await context.SaveChangesAsync(cancellationToken);

		return plainCodes.AsReadOnly();
	}

	/// <inheritdoc/>
	public async Task<bool> VerifyAndConsumeCodeAsync(
		long userId,
		string code,
		CancellationToken cancellationToken)
	{
		// Get all unused codes for the user
		List<BackupCode> unusedCodes =
			await context
				.BackupCodes
				.Where(backupCode =>
					backupCode.UserId == userId
					&& !backupCode.IsUsed)
				.ToListAsync(cancellationToken);

		// Try to verify against each unused code
		foreach (BackupCode backupCode in unusedCodes)
		{
			PasswordVerificationResult verificationResult =
				passwordHasher.VerifyHashedPassword(
					backupCode,
					backupCode.CodeHash,
					code);

			if (verificationResult is PasswordVerificationResult.Success
				or PasswordVerificationResult.SuccessRehashNeeded)
			{
				// Mark code as used
				backupCode.IsUsed = true;
				backupCode.UsedAt =
					timeProvider.GetUtcNow();

				await context.SaveChangesAsync(cancellationToken);

				return true;
			}
		}

		return false;
	}

	/// <inheritdoc/>
	public async Task<int> GetRemainingCountAsync(
		long userId,
		CancellationToken cancellationToken)
	{
		int count =
			await context
				.BackupCodes
				.CountAsync(
					backupCode =>
						backupCode.UserId == userId
						&& !backupCode.IsUsed,
					cancellationToken);

		return count;
	}

	/// <summary>
	/// Generates a cryptographically secure random alphanumeric code.
	/// </summary>
	/// <param name="length">
	/// The desired code length.
	/// </param>
	/// <returns>
	/// An uppercase alphanumeric code.
	/// </returns>
	private static string GenerateRandomCode(int length)
	{
		// Use alphanumeric characters excluding ambiguous ones (0/O, 1/I/L)
		const string allowedChars =
			"23456789ABCDEFGHJKMNPQRSTUVWXYZ";

		Span<char> result =
			stackalloc char[length];

		for (int index = 0; index < length; index++)
		{
			result[index] =
				GetUnbiasedRandomChar(allowedChars);
		}

		return new string(result);
	}

	/// <summary>
	/// Generates a single unbiased random character from the allowed set
	/// using rejection sampling to eliminate modulo bias.
	/// </summary>
	///
	/// <remarks>
	/// Without rejection sampling, <c>randomByte % allowedChars.Length</c>
	/// causes bias because <c>256 % 30 = 16</c>, making the first 16
	/// characters slightly more probable than the remaining 14.
	/// </remarks>
	///
	/// <param name="allowedCharacters">
	/// The set of allowed characters.
	/// </param>
	///
	/// <returns>
	/// A uniformly random character from the allowed set.
	/// </returns>
	private static char GetUnbiasedRandomChar(
		ReadOnlySpan<char> allowedCharacters)
	{
		int uniformRange =
			byte.MaxValue + 1
			- ((byte.MaxValue + 1) % allowedCharacters.Length);

		Span<byte> randomBuffer =
			stackalloc byte[1];

		int randomValue;

		do
		{
			RandomNumberGenerator.Fill(randomBuffer);
			randomValue =
				randomBuffer[0];
		}
		while (randomValue >= uniformRange);

		return allowedCharacters[randomValue % allowedCharacters.Length];
	}
}