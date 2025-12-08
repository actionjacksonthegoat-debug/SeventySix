// <copyright file="IAuthenticationService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Core authentication operations: login, logout, token refresh.
/// </summary>
/// <remarks>
/// Focused service following SRP - handles only authentication flows.
/// For registration, use <see cref="IRegistrationService"/>.
/// For password operations, use <see cref="IPasswordService"/>.
/// For OAuth, use <see cref="IOAuthService"/>.
/// </remarks>
public interface IAuthenticationService
{
	/// <summary>
	/// Authenticates a user with username/email and password.
	/// </summary>
	/// <param name="request">Login credentials.</param>
	/// <param name="clientIp">Client IP for token tracking.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Authentication result with tokens or error.</returns>
	public Task<AuthResult> LoginAsync(
		LoginRequest request,
		string? clientIp,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Exchanges a refresh token for new access and refresh tokens.
	/// </summary>
	/// <param name="refreshToken">The current refresh token.</param>
	/// <param name="clientIp">Client IP for token tracking.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>New token pair or error.</returns>
	public Task<AuthResult> RefreshTokensAsync(
		string refreshToken,
		string? clientIp,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Revokes the specified refresh token (logout).
	/// </summary>
	/// <param name="refreshToken">The refresh token to revoke.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>True if revoked successfully.</returns>
	public Task<bool> LogoutAsync(
		string refreshToken,
		CancellationToken cancellationToken = default);
}