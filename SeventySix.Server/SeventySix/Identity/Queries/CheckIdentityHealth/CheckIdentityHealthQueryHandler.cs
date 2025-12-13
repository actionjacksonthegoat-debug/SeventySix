// <copyright file="CheckIdentityHealthQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Handler for checking Identity database health.
/// </summary>
public static class CheckIdentityHealthQueryHandler
{
	/// <summary>
	/// Handles the health check query for the Identity database.
	/// </summary>
	/// <param name="query">The health check query.</param>
	/// <param name="repository">The user repository for data access.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>True if database is healthy, false otherwise.</returns>
	public static async Task<bool> HandleAsync(
		CheckIdentityHealthQuery query,
		IUserRepository repository,
		CancellationToken cancellationToken)
	{
		try
		{
			UserQueryRequest healthCheckRequest =
				new()
				{
					Page = 1,
					PageSize = 1
				};

			_ = await repository.GetPagedAsync(
				healthCheckRequest,
				cancellationToken);

			return true;
		}
		catch
		{
			return false;
		}
	}
}