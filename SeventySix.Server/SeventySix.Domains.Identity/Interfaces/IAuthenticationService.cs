// <copyright file="IAuthenticationService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Authentication token generation operations.
/// </summary>
/// <remarks>
/// Encapsulates authentication workflows including token generation,
/// role loading, and last login tracking.
/// </remarks>
public interface IAuthenticationService
{
	/// <summary>
	/// Generates authentication result with access and refresh tokens for Identity <see cref="ApplicationUser"/>.
	/// </summary>
	/// <param name="user">
	/// The identity user to issue tokens for.
	/// </param>
	/// <param name="requiresPasswordChange">
	/// Whether the user must change password on next login.
	/// </param>
	/// <param name="rememberMe">
	/// If true, issues a long-lived refresh token.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// An <see cref="AuthResult"/> with tokens and metadata.
	/// </returns>
	public Task<AuthResult> GenerateAuthResultAsync(
		ApplicationUser user,
		bool requiresPasswordChange,
		bool rememberMe,
		CancellationToken cancellationToken);
}