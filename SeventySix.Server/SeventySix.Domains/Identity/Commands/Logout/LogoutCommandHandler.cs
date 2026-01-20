// <copyright file="LogoutCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.POCOs;

namespace SeventySix.Identity;

/// <summary>
/// Handler for logout command.
/// </summary>
public static class LogoutCommandHandler
{
	/// <summary>
	/// Handles logout by revoking the refresh token.
	/// </summary>
	/// <param name="command">
	/// The logout command containing the refresh token.
	/// </param>
	/// <param name="tokenService">
	/// Token service.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A Result indicating success or failure with error details.
	/// </returns>
	public static async Task<Result> HandleAsync(
		LogoutCommand command,
		ITokenService tokenService,
		CancellationToken cancellationToken)
	{
		bool revoked =
			await tokenService.RevokeRefreshTokenAsync(
				command.RefreshToken,
				cancellationToken);

		return revoked
			? Result.Success()
			: Result.Failure("Token not found or already revoked");
	}
}