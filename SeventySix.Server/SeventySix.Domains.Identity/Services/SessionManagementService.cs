// <copyright file="SessionManagementService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;

namespace SeventySix.Identity;

/// <summary>
/// Enforces maximum concurrent session limits per user.
/// </summary>
/// <remarks>
/// When the session limit is reached, the oldest active token is revoked
/// to make room for a new session.
/// </remarks>
public sealed class SessionManagementService(
	ITokenRepository tokenRepository,
	IOptions<AuthSettings> authSettings) : ISessionManagementService
{
	/// <inheritdoc/>
	public async Task EnforceSessionLimitAsync(
		long userId,
		DateTimeOffset now,
		CancellationToken cancellationToken)
	{
		int maxSessions =
			authSettings.Value.Token.MaxActiveSessionsPerUser;

		int activeTokenCount =
			await tokenRepository.GetActiveSessionCountAsync(
				userId,
				now,
				cancellationToken);

		if (activeTokenCount < maxSessions)
		{
			return;
		}

		// Revoke oldest active token to make room for new one
		await tokenRepository.RevokeOldestActiveTokenAsync(
			userId,
			now,
			now,
			cancellationToken);
	}
}