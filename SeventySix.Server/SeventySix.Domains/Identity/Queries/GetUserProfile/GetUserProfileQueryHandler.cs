// <copyright file="GetUserProfileQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Handler for <see cref="GetUserProfileQuery"/>.
/// </summary>
public static class GetUserProfileQueryHandler
{
	/// <summary>
	/// Handles retrieval of a user's profile.
	/// </summary>
	/// <param name="query">The query.</param>
	/// <param name="repository">User repository.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The user profile or null if not found.</returns>
	public static async Task<UserProfileDto?> HandleAsync(
		GetUserProfileQuery query,
		IUserQueryRepository repository,
		CancellationToken cancellationToken)
	{
		return await repository.GetUserProfileAsync(
			query.UserId,
			cancellationToken);
	}
}