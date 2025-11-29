// <copyright file="TestTables.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.TestUtilities.Constants;

/// <summary>
/// Centralized table name constants for test cleanup.
/// Prevents DRY violations and typos in table names.
/// Tables are ordered to respect foreign key constraints (child tables first).
/// </summary>
public static class TestTables
{
	/// <summary>
	/// All Identity bounded context tables in dependency order (children first).
	/// </summary>
	public static readonly string[] Identity =
		[
			"\"Identity\".\"RefreshTokens\"",
			"\"Identity\".\"ExternalLogins\"",
			"\"Identity\".\"UserCredentials\"",
			"\"Identity\".\"UserRoles\"",
			"\"Identity\".\"PasswordResetTokens\"",
			"\"Identity\".\"EmailVerificationTokens\"",
			"\"Identity\".\"Users\""
		];

	/// <summary>
	/// All Logging bounded context tables.
	/// </summary>
	public static readonly string[] Logging =
		[
			"\"Logging\".\"Logs\""
		];

	/// <summary>
	/// All ApiTracking bounded context tables.
	/// </summary>
	public static readonly string[] ApiTracking =
		[
			"\"ApiTracking\".\"ThirdPartyApiRequests\""
		];

	/// <summary>
	/// All tables across all bounded contexts.
	/// Use for full database cleanup between tests.
	/// </summary>
	public static readonly string[] All =
		[
			..Identity,
			..Logging,
			..ApiTracking
		];
}