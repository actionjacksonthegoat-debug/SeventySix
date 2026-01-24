// <copyright file="CollectionNames.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.TestUtilities.Constants;

/// <summary>
/// Collection names for xUnit test parallelization.
/// Each bounded context gets its own PostgreSQL container for parallel execution.
/// </summary>
public static class CollectionNames
{
	/// <summary>
	/// General PostgreSQL collection for cross-domain tests (Api.Tests).
	/// Tests using this collection share the same PostgreSQL container instance.
	/// </summary>
	public const string PostgreSql = "PostgreSQL";

	/// <summary>
	/// Identity bounded context PostgreSQL collection.
	/// Runs in parallel with other domain collections.
	/// </summary>
	public const string IdentityPostgreSql = "Identity.PostgreSql";

	/// <summary>
	/// Logging bounded context PostgreSQL collection.
	/// Runs in parallel with other domain collections.
	/// </summary>
	public const string LoggingPostgreSql = "Logging.PostgreSql";

	/// <summary>
	/// ApiTracking bounded context PostgreSQL collection.
	/// Runs in parallel with other domain collections.
	/// </summary>
	public const string ApiTrackingPostgreSql = "ApiTracking.PostgreSql";

	/// <summary>
	/// ElectronicNotifications bounded context PostgreSQL collection.
	/// Runs in parallel with other domain collections.
	/// </summary>
	public const string ElectronicNotificationsPostgreSql = "ElectronicNotifications.PostgreSql";

	/// <summary>
	/// Identity authentication-specific PostgreSQL collection.
	/// For AuthController, AuthRateLimiting, and related tests.
	/// </summary>
	public const string IdentityAuthPostgreSql = "Identity.Auth.PostgreSql";

	/// <summary>
	/// Identity user management-specific PostgreSQL collection.
	/// For UsersController and related tests.
	/// </summary>
	public const string IdentityUsersPostgreSql = "Identity.Users.PostgreSql";

	/// <summary>
	/// Identity health and permissions PostgreSQL collection.
	/// For HealthController, Permissions, and related tests.
	/// </summary>
	public const string IdentityHealthPostgreSql = "Identity.Health.PostgreSql";
}