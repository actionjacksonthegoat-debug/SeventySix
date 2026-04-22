// <copyright file="ISessionManagementService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Session limit enforcement for active refresh token sessions.
/// </summary>
/// <remarks>
/// Enforces a maximum number of concurrent sessions per user
/// by revoking the oldest active token when the limit is exceeded.
/// </remarks>
public interface ISessionManagementService
{
	/// <summary>
	/// Revokes the oldest active token if the user has reached the maximum session limit.
	/// </summary>
	/// <param name="userId">
	/// The user ID to enforce limits for.
	/// </param>
	/// <param name="now">
	/// Current timestamp used for comparisons.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	public Task EnforceSessionLimitAsync(
		long userId,
		DateTimeOffset now,
		CancellationToken cancellationToken);
}