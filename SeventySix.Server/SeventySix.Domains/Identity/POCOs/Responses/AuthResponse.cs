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
/// Temporary token identifying the MFA challenge (null if MFA not required).
/// </param>
public record AuthResponse(
	string? AccessToken,
	DateTime? ExpiresAt,
	string? Email,
	string? FullName,
	bool RequiresPasswordChange = false,
	bool RequiresMfa = false,
	string? MfaChallengeToken = null)
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
			MfaChallengeToken: result.MfaChallengeToken);
}