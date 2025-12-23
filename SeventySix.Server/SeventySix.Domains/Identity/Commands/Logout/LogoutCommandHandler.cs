// <copyright file="LogoutCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Handler for logout command.
/// </summary>
public static class LogoutCommandHandler
{
	/// <summary>
	/// Handles logout by revoking the refresh token.
	/// </summary>
	/// <param name="refreshToken">
	/// The refresh token to revoke.
	/// </param>
	/// <param name="tokenService">
	/// Token service.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// True if the token was revoked; otherwise false.
	/// </returns>
	public static async Task<bool> HandleAsync(
		string refreshToken,
		ITokenService tokenService,
		CancellationToken cancellationToken)
	{
		return await tokenService.RevokeRefreshTokenAsync(
			refreshToken,
			cancellationToken);
	}
}