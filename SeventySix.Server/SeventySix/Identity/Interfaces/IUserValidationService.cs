// <copyright file="IUserValidationService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// User validation operations.
/// </summary>
/// <remarks>
/// Focused service following SRP - handles user uniqueness validation.
/// </remarks>
public interface IUserValidationService
{
	/// <summary>
	/// Checks if a username is already in use.
	/// </summary>
	/// <param name="username">The username to check.</param>
	/// <param name="excludeUserId">Optional user ID to exclude from the check (for updates).</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>True if the username exists; otherwise false.</returns>
	public Task<bool> UsernameExistsAsync(
		string username,
		int? excludeUserId = null,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Checks if an email is already in use.
	/// </summary>
	/// <param name="email">The email to check.</param>
	/// <param name="excludeUserId">Optional user ID to exclude from the check (for updates).</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>True if the email exists; otherwise false.</returns>
	public Task<bool> EmailExistsAsync(
		string email,
		int? excludeUserId = null,
		CancellationToken cancellationToken = default);
}