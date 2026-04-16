// <copyright file="TokenRevocationService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Extensions;

namespace SeventySix.Identity;

/// <summary>
/// Handles revocation of refresh tokens — individual, family, and user-wide.
/// </summary>
/// <remarks>
/// Token hashing uses SHA256 via <see cref="CryptoExtensions"/> before storage lookup.
/// All revocation operations set <c>IsRevoked = true</c> and record the revocation timestamp.
/// </remarks>
public sealed class TokenRevocationService(
	ITokenRepository tokenRepository,
	TimeProvider timeProvider) : ITokenRevocationService
{
	/// <inheritdoc/>
	public async Task<bool> RevokeRefreshTokenAsync(
		string refreshToken,
		CancellationToken cancellationToken = default)
	{
		string tokenHash =
			CryptoExtensions.ComputeSha256Hash(refreshToken);

		DateTimeOffset now =
			timeProvider.GetUtcNow();

		return await tokenRepository.RevokeByHashAsync(
			tokenHash,
			now,
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<int> RevokeAllUserTokensAsync(
		long userId,
		CancellationToken cancellationToken = default)
	{
		DateTimeOffset now =
			timeProvider.GetUtcNow();

		return await tokenRepository.RevokeAllUserTokensAsync(
			userId,
			now,
			cancellationToken);
	}
}