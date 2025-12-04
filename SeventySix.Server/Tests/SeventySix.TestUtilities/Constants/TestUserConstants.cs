// <copyright file="TestUserConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.TestUtilities.Constants;

/// <summary>
/// Test user data constants.
/// Single source of truth for test user values (DRY).
/// </summary>
public static class TestUserConstants
{
	/// <summary>Default test email address.</summary>
	public const string DefaultEmail = "test@example.com";

	/// <summary>Default test username.</summary>
	public const string DefaultUsername = "testuser";

	/// <summary>Default test full name.</summary>
	public const string DefaultFullName = "Test User";

	/// <summary>Default test password.</summary>
	public const string DefaultPassword = "TestPassword123!";

	/// <summary>Updated test email for update operations.</summary>
	public const string UpdatedEmail = "updated@example.com";
}
