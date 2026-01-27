// <copyright file="IBackupCodeService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Service for backup code operations.
/// </summary>
public interface IBackupCodeService
{
	/// <summary>
	/// Generates new backup codes for a user, replacing any existing codes.
	/// </summary>
	/// <param name="userId">
	/// The user's ID.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Plain text codes (shown to user once only).
	/// </returns>
	public Task<IReadOnlyList<string>> GenerateCodesAsync(
		long userId,
		CancellationToken cancellationToken);

	/// <summary>
	/// Verifies and consumes a backup code.
	/// </summary>
	/// <param name="userId">
	/// The user's ID.
	/// </param>
	/// <param name="code">
	/// The backup code to verify.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// True if the code was valid and consumed.
	/// </returns>
	public Task<bool> VerifyAndConsumeCodeAsync(
		long userId,
		string code,
		CancellationToken cancellationToken);

	/// <summary>
	/// Gets the count of remaining unused backup codes.
	/// </summary>
	/// <param name="userId">
	/// The user's ID.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The number of remaining unused backup codes.
	/// </returns>
	public Task<int> GetRemainingCountAsync(
		long userId,
		CancellationToken cancellationToken);
}