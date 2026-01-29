import {
	inject,
	Injectable
} from "@angular/core";
import { QueryKeys } from "@shared/utilities/query-keys.utility";
import { QueryClient } from "@tanstack/angular-query-experimental";

/**
 * Service for coordinating cache invalidation across domain boundaries.
 * Provides methods to invalidate caches that span multiple domains.
 * Follows domain isolation by living in @shared.
 *
 * @remarks
 * Use when mutations in one domain affect data cached by another domain.
 * Examples: Admin user updates → Account profile cache
 */
@Injectable(
	{
		providedIn: "root"
	})
export class CacheCoordinationService
{
	private readonly queryClient: QueryClient =
		inject(QueryClient);

	/**
	 * Invalidates account profile cache for a specific user.
	 * Call when admin updates user data that affects the user's own profile view.
	 *
	 * @param {number | string} _userId
	 * The user ID whose account cache should be invalidated.
	 * Currently invalidates all account caches since client doesn't track user sessions.
	 *
	 * @returns {void}
	 */
	invalidateUserAccountCache(_userId: number | string): void
	{
		// Invalidate account profile (user's own view of their data)
		this.queryClient.invalidateQueries(
			{
				queryKey: QueryKeys.account.profile
			});

		// Invalidate account available roles
		this.queryClient.invalidateQueries(
			{
				queryKey: QueryKeys.account.availableRoles
			});
	}

	/**
	 * Invalidates all permission-related caches across domains.
	 * Call when permission requests are approved or rejected.
	 *
	 * @returns {void}
	 */
	invalidatePermissionCaches(): void
	{
		this.queryClient.invalidateQueries(
			{
				queryKey: QueryKeys.permissionRequests.all
			});

		this.queryClient.invalidateQueries(
			{
				queryKey: QueryKeys.account.availableRoles
			});
	}

	/**
	 * Invalidates all user-related caches after bulk operations.
	 * Call when bulk activate/deactivate affects multiple users.
	 *
	 * @returns {void}
	 */
	invalidateAllUserCaches(): void
	{
		this.queryClient.invalidateQueries(
			{
				queryKey: QueryKeys.users.all
			});

		this.queryClient.invalidateQueries(
			{
				queryKey: QueryKeys.account.profile
			});
	}
}
