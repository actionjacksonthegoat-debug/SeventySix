// <copyright file="IMfaOrchestrator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Orchestrates MFA challenge decisions and trusted device bypass for the login flow.
/// Encapsulates the MFA-related dependencies of <see cref="LoginCommandHandler"/>
/// into a single cohesive service.
/// </summary>
public interface IMfaOrchestrator
{
	/// <summary>
	/// Determines whether MFA is required for the given user based on global settings
	/// and the user's individual MFA enrollment.
	/// </summary>
	/// <param name="user">
	/// The authenticated user.
	/// </param>
	/// <returns>
	/// True if MFA is required; false if login can proceed without MFA.
	/// </returns>
	public bool IsMfaRequired(ApplicationUser user);

	/// <summary>
	/// Attempts to bypass MFA via a trusted device token.
	/// Returns a successful <see cref="AuthResult"/> with generated tokens if bypass
	/// succeeds, or null if MFA is still required.
	/// </summary>
	/// <param name="command">
	/// The login command containing the trusted device token, user agent, and IP.
	/// </param>
	/// <param name="user">
	/// The authenticated user.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A successful <see cref="AuthResult"/> if the device is trusted and MFA is bypassed;
	/// null if MFA is still required.
	/// </returns>
	public Task<AuthResult?> TryBypassViaTrustedDeviceAsync(
		LoginCommand command,
		ApplicationUser user,
		CancellationToken cancellationToken);

	/// <summary>
	/// Initiates an MFA challenge for the user, selecting either TOTP or email-based MFA
	/// based on the user's enrollment and global settings.
	/// </summary>
	/// <param name="user">
	/// The authenticated user requiring MFA.
	/// </param>
	/// <param name="clientIp">
	/// Client IP address for audit logging.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// An <see cref="AuthResult"/> requiring MFA verification.
	/// </returns>
	public Task<AuthResult> InitiateChallengeAsync(
		ApplicationUser user,
		string? clientIp,
		CancellationToken cancellationToken);
}
