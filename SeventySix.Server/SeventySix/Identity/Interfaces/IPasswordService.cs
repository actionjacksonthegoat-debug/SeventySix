// <copyright file="IPasswordService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Password management operations.
/// </summary>
/// <remarks>
/// Focused service following SRP - handles password reset, change, and set operations.
/// </remarks>
public interface IPasswordService
{
	/// <summary>
	/// Changes the current user's password.
	/// </summary>
	/// <param name="userId">The authenticated user's ID.</param>
	/// <param name="request">Password change request.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Result indicating success or failure with error details.</returns>
	public Task<AuthResult> ChangePasswordAsync(
		int userId,
		ChangePasswordRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Initiates a password reset flow by creating a reset token and sending an email.
	/// </summary>
	/// <remarks>
	/// Used for both:
	/// - Admin creating new user (welcome email with password setup)
	/// - User requesting password reset (forgot password).
	/// </remarks>
	/// <param name="userId">The user's ID.</param>
	/// <param name="isNewUser">True for welcome email, false for password reset email.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	public Task InitiatePasswordResetAsync(
		int userId,
		bool isNewUser,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Initiates password reset by email address (public endpoint).
	/// </summary>
	/// <remarks>
	/// Silently succeeds even if email doesn't exist (prevents email enumeration).
	/// Only sends email if user exists and is active.
	/// </remarks>
	/// <param name="email">The email address to send reset link to.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	public Task InitiatePasswordResetByEmailAsync(
		string email,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Sets a new password using a valid password reset token.
	/// </summary>
	/// <remarks>
	/// Validates the token, sets the password, and marks the token as used.
	/// Returns AuthResult to allow immediate login after password setup.
	/// </remarks>
	/// <param name="request">The set password request containing token and new password.</param>
	/// <param name="clientIp">Client IP for token tracking.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Authentication result with tokens if successful, or error.</returns>
	public Task<AuthResult> SetPasswordAsync(
		SetPasswordRequest request,
		string? clientIp,
		CancellationToken cancellationToken = default);
}