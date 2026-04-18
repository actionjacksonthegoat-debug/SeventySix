// <copyright file="ITrustedDeviceLimitEnforcer.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Enforces the maximum trusted device limit per user.
/// </summary>
/// <remarks>
/// When a user exceeds the configured maximum device count,
/// the oldest devices (by last-used or creation date) are automatically removed.
/// </remarks>
public interface ITrustedDeviceLimitEnforcer
{
	/// <summary>
	/// Removes the oldest trusted devices when the user is at or above the limit.
	/// </summary>
	/// <param name="userId">
	/// The user's ID.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	Task EnforceDeviceLimitAsync(
		long userId,
		CancellationToken cancellationToken);
}
