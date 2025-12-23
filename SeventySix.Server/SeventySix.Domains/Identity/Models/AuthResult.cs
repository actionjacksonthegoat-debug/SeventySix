// <copyright file="AuthResult.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Authentication result with tokens or error information.
/// Internal model - not exposed via API (use AuthResponse for API contracts).
/// </summary>
/// <param name="Success">
/// Whether authentication succeeded.
/// </param>
/// <param name="AccessToken">
/// JWT access token (null on failure).
/// </param>
/// <param name="RefreshToken">
/// Refresh token (null on failure).
/// </param>
/// <param name="ExpiresAt">
/// Access token expiration time.
/// </param>
/// <param name="Email">
/// User's email address (null on failure).
/// </param>
/// <param name="FullName">
/// User's full name (null if not set or on failure).
/// </param>
/// <param name="RequiresPasswordChange">
/// Whether user must change password before accessing the app.
/// </param>
/// <param name="Error">
/// Error message (null on success).
/// </param>
/// <param name="ErrorCode">
/// Error code for client handling.
/// </param>
public record AuthResult(
	bool Success,
	string? AccessToken = null,
	string? RefreshToken = null,
	DateTime? ExpiresAt = null,
	string? Email = null,
	string? FullName = null,
	bool RequiresPasswordChange = false,
	string? Error = null,
	string? ErrorCode = null)
{
	/// <summary>
	/// Creates a successful result without tokens (e.g., password change).
	/// </summary>
	/// <returns>
	/// Success result.
	/// </returns>
	public static AuthResult Succeeded() => new(Success: true);

	/// <summary>
	/// Creates a successful authentication result.
	/// </summary>
	/// <param name="accessToken">
	/// The JWT access token.
	/// </param>
	/// <param name="refreshToken">
	/// The refresh token.
	/// </param>
	/// <param name="expiresAt">
	/// Token expiration time.
	/// </param>
	/// <param name="email">
	/// User's email address.
	/// </param>
	/// <param name="fullName">
	/// User's full name (optional).
	/// </param>
	/// <param name="requiresPasswordChange">
	/// Whether user must change password.
	/// </param>
	/// <returns>
	/// Success result with tokens.
	/// </returns>
	public static AuthResult Succeeded(
		string accessToken,
		string refreshToken,
		DateTime expiresAt,
		string email,
		string? fullName,
		bool requiresPasswordChange = false) =>
		new(
			Success: true,
			AccessToken: accessToken,
			RefreshToken: refreshToken,
			ExpiresAt: expiresAt,
			Email: email,
			FullName: fullName,
			RequiresPasswordChange: requiresPasswordChange);

	/// <summary>
	/// Creates a failed authentication result.
	/// </summary>
	/// <param name="error">
	/// Error message.
	/// </param>
	/// <param name="errorCode">
	/// Error code for client handling.
	/// </param>
	/// <returns>
	/// Failure result with error details.
	/// </returns>
	public static AuthResult Failed(string error, string? errorCode = null) =>
		new(Success: false, Error: error, ErrorCode: errorCode);
}

/// <summary>
/// Standard authentication error codes.
/// </summary>
public static class AuthErrorCodes
{
	/// <summary>Invalid credentials.</summary>
	public const string InvalidCredentials = "INVALID_CREDENTIALS";

	/// <summary>Account is locked.</summary>
	public const string AccountLocked = "ACCOUNT_LOCKED";

	/// <summary>Account is inactive.</summary>
	public const string AccountInactive = "ACCOUNT_INACTIVE";

	/// <summary>Username already exists.</summary>
	public const string UsernameExists = "USERNAME_EXISTS";

	/// <summary>Email already exists.</summary>
	public const string EmailExists = "EMAIL_EXISTS";

	/// <summary>Invalid or expired refresh token.</summary>
	public const string InvalidToken = "INVALID_TOKEN";

	/// <summary>Refresh token reuse detected (potential attack).</summary>
	public const string TokenReuse = "TOKEN_REUSE";

	/// <summary>OAuth error occurred.</summary>
	public const string OAuthError = "OAUTH_ERROR";

	/// <summary>Password does not meet requirements.</summary>
	public const string WeakPassword = "WEAK_PASSWORD";

	/// <summary>Token has expired.</summary>
	public const string TokenExpired = "TOKEN_EXPIRED";

	/// <summary>User not found.</summary>
	public const string UserNotFound = "USER_NOT_FOUND";
}