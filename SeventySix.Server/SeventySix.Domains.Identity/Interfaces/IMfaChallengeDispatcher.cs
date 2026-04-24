// <copyright file="IMfaChallengeDispatcher.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Dispatches an MFA challenge for a user by selecting the appropriate challenge method
/// (TOTP or email-based) and issuing the challenge token.
/// </summary>
/// <remarks>
/// This interface has a single responsibility: "create a challenge." Login-flow policy
/// decisions (whether MFA is required, trusted-device bypass) are handled by
/// <see cref="LoginCommandHandler"/> directly.
/// </remarks>
public interface IMfaChallengeDispatcher
{
	/// <summary>
	/// Initiates an MFA challenge for the user, selecting either TOTP or email-based MFA
	/// based on the user's enrollment and global TOTP settings.
	/// </summary>
	/// <param name="user">
	/// The authenticated user requiring an MFA challenge.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// An <see cref="AuthResult"/> requiring MFA verification.
	/// </returns>
	public Task<AuthResult> InitiateChallengeAsync(
		ApplicationUser user,
		CancellationToken cancellationToken);
}