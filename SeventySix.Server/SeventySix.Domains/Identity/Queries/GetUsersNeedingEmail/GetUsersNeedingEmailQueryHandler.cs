// <copyright file="GetUsersNeedingEmailQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Handler for <see cref="GetUsersNeedingEmailQuery"/>.
/// </summary>
public static class GetUsersNeedingEmailQueryHandler
{
	/// <summary>
	/// Handles retrieval of users who need pending emails.
	/// </summary>
	/// <param name="query">
	/// The query.
	/// </param>
	/// <param name="repository">
	/// User repository.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Collection of users needing emails.
	/// </returns>
	public static async Task<IEnumerable<UserDto>> HandleAsync(
		GetUsersNeedingEmailQuery query,
		IUserQueryRepository repository,
		CancellationToken cancellationToken)
	{
		return await repository.GetUsersNeedingEmailAsync(cancellationToken);
	}
}