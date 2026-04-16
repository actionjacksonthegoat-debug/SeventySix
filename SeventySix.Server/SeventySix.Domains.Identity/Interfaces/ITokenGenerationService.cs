// <copyright file="ITokenGenerationService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Token generation operations for JWT access tokens and refresh tokens.
/// </summary>
/// <remarks>
/// Handles stateless JWT creation and cryptographic refresh token generation.
/// Delegates session limit enforcement to <see cref="ISessionManagementService"/>.
/// </remarks>
public interface ITokenGenerationService
{
	/// <summary>
	/// Generates a JWT access token for the specified user.
	/// </summary>
	/// <param name="userId">
	/// The user's ID.
	/// </param>
	/// <param name="username">
	/// The user's username.
	/// </param>
	/// <param name="roles">
	/// The user's roles.
	/// </param>
	/// <param name="requiresPasswordChange">
	/// Whether the user must change their password before accessing the application.
	/// When true, a <c>requires_password_change</c> claim is added to the JWT.
	/// </param>
	/// <returns>
	/// The JWT access token string.
	/// </returns>
	public string GenerateAccessToken(
		long userId,
		string username,
		IEnumerable<string> roles,
		bool requiresPasswordChange = false);

	/// <summary>
	/// Generates a new refresh token with a new family and stores it.
	/// </summary>
	/// <param name="userId">
	/// The user's ID.
	/// </param>
	/// <param name="rememberMe">
	/// Whether to extend refresh token expiration.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The plaintext refresh token (hash stored in database).
	/// </returns>
	public Task<string> GenerateRefreshTokenAsync(
		long userId,
		bool rememberMe = false,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Generates a new refresh token inheriting an existing token family.
	/// Used during token rotation to maintain family tracking for reuse detection.
	/// </summary>
	/// <param name="userId">
	/// The user's ID.
	/// </param>
	/// <param name="rememberMe">
	/// Whether to extend refresh token expiration.
	/// </param>
	/// <param name="familyId">
	/// The token family GUID to inherit.
	/// </param>
	/// <param name="sessionStartedAt">
	/// Optional session start timestamp for absolute timeout tracking.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The plaintext refresh token (hash stored in database).
	/// </returns>
	public Task<string> GenerateRefreshTokenWithFamilyAsync(
		long userId,
		bool rememberMe,
		Guid familyId,
		DateTimeOffset? sessionStartedAt = null,
		CancellationToken cancellationToken = default);
}