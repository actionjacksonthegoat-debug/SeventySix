// <copyright file="GetAvailableRolesQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Identity.Constants;
using SeventySix.Shared.Constants;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Identity.Queries.GetAvailableRoles;

/// <summary>
/// Handler for retrieving roles available for a user to request with cache-aside pattern.
/// </summary>
/// <remarks>
/// Caching Strategy (per Microsoft best practices):
/// - Available roles are semi-static reference data (role definitions rarely change)
/// - However, user's existing roles/pending requests can change
/// - TTL: 1 minute (Identity cache default) - balances freshness vs performance
/// - Cache invalidation: On role assignment or permission request creation
/// </remarks>
public static class GetAvailableRolesQueryHandler
{
	/// <summary>
	/// Handles the query to get available roles for a user with cache-aside pattern.
	/// </summary>
	/// <param name="query">
	/// The query containing user ID.
	/// </param>
	/// <param name="repository">
	/// The permission request repository.
	/// </param>
	/// <param name="cacheProvider">
	/// The FusionCache provider for named cache access.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// List of available roles the user can request.
	/// </returns>
	public static async Task<IEnumerable<AvailableRoleDto>> HandleAsync(
		GetAvailableRolesQuery query,
		IPermissionRequestRepository repository,
		IFusionCacheProvider cacheProvider,
		CancellationToken cancellationToken)
	{
		IFusionCache cache =
			cacheProvider.GetCache(CacheNames.Identity);

		string cacheKey =
			IdentityCacheKeys.AvailableRoles(query.UserId);

		// Try cache first — TryGetAsync returns MaybeValue<T> (not nullable)
		MaybeValue<List<AvailableRoleDto>> cached =
			await cache.TryGetAsync<List<AvailableRoleDto>>(
				cacheKey,
				token: cancellationToken);

		if (cached.HasValue)
		{
			return cached.Value ?? [];
		}

		// Cache miss — fetch with current scoped DbContext (still alive)
		List<AvailableRoleDto> roles =
			(await FetchAvailableRolesAsync(
				query.UserId,
				repository,
				cancellationToken))
				.ToList();

		// Store in cache
		await cache.SetAsync(
			cacheKey,
			roles,
			token: cancellationToken);

		return roles;
	}

	/// <summary>
	/// Fetches available roles from the database.
	/// </summary>
	/// <param name="userId">
	/// The user ID.
	/// </param>
	/// <param name="repository">
	/// The permission request repository.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// List of available roles.
	/// </returns>
	private static async Task<IEnumerable<AvailableRoleDto>> FetchAvailableRolesAsync(
		long userId,
		IPermissionRequestRepository repository,
		CancellationToken cancellationToken)
	{
		IEnumerable<string> existingRoles =
			await repository.GetUserExistingRolesAsync(
				userId,
				cancellationToken);

		IEnumerable<PermissionRequest> pendingRequests =
			await repository.GetByUserIdAsync(userId, cancellationToken);

		HashSet<string> excludedRoles =
			existingRoles
				.Concat(
					pendingRequests
						.Select(request => request.RequestedRole?.Name)
						.Where(name => name != null)!
						.Cast<string>())
				.ToHashSet(StringComparer.OrdinalIgnoreCase);

		return
			[
				.. RoleConstants
					.AllRequestableRoles
					.Where(
						role =>
							!excludedRoles.Contains(role.Name)),
			];
	}
}