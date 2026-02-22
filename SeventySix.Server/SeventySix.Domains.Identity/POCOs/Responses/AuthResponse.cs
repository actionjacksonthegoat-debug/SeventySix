// <copyright file="AuthResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Authentication response with access token.
/// </summary>
/// <param name="AccessToken">
/// JWT access token (null when MFA required).
/// </param>
/// <param name="ExpiresAt">
/// Token expiration time (null when MFA required).
/// </param>
/// <param name="Email">
/// User's email address (masked when MFA required).
/// </param>
/// <param name="FullName">
/// User's full name (null if not set or MFA required).
/// </param>
/// <param name="RequiresPasswordChange">
/// Whether user must change password before using the app.
/// </param>
/// <param name="RequiresMfa">
/// Whether MFA verification is required to complete authentication.
/// </param>
/// <param name="MfaChallengeToken">
/// Temporary token identifying the MFA challenge (null if MFA not required or TOTP).
/// </param>
/// <param name="MfaMethod">
/// The preferred MFA method required for verification (null if MFA not required).
/// </param>
/// <param name="AvailableMfaMethods">
/// All available MFA methods for the user (null if MFA not required).
/// </param>
/// <param name="SessionInactivityMinutes">
/// Session inactivity timeout in minutes (0 = disabled).
/// </param>
/// <param name="SessionWarningSeconds">
/// Seconds before inactivity timeout to display warning.
/// </param>
public record AuthResponse(
	string? AccessToken,
	DateTimeOffset? ExpiresAt,
	string? Email,
	string? FullName,
	bool RequiresPasswordChange = false,
	bool RequiresMfa = false,
	string? MfaChallengeToken = null,
	MfaMethod? MfaMethod = null,
	IReadOnlyList<MfaMethod>? AvailableMfaMethods = null,
	int SessionInactivityMinutes = 0,
	int SessionWarningSeconds = 0)
{
	/// <summary>
	/// Creates an AuthResponse from an AuthResult.
	/// </summary>
	/// <param name="result">
	/// The auth result to convert.
	/// </param>
	/// <returns>
	/// AuthResponse instance.
	/// </returns>
	public static AuthResponse FromResult(AuthResult result) =>
		new(
			AccessToken: result.AccessToken,
			ExpiresAt: result.ExpiresAt,
			Email: result.Email,
			FullName: result.FullName,
			RequiresPasswordChange: result.RequiresPasswordChange,
			RequiresMfa: result.RequiresMfa,
			MfaChallengeToken: result.MfaChallengeToken,
			MfaMethod: result.MfaMethod,
			AvailableMfaMethods: result.AvailableMfaMethods,
			SessionInactivityMinutes: 0,
			SessionWarningSeconds: 0);
}