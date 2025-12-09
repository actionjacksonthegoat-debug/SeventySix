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
	/// Handles logout command.
	/// </summary>
	public static async Task<bool> HandleAsync(
		LogoutCommand command,
		ITokenService tokenService,
		CancellationToken cancellationToken)
	{
		return await tokenService.RevokeRefreshTokenAsync(
			command.RefreshToken,
			cancellationToken);
	}
}
