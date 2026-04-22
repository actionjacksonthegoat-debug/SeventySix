// <copyright file="E2EUserFixtureCatalog.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics.CodeAnalysis;
using SeventySix.Identity.Constants;

namespace SeventySix.Api.Seeders;

/// <summary>
/// Declarative catalog of E2E test user fixtures, grouped by scenario.
/// Extracted from <see cref="E2ETestSeeder"/> to keep seeding logic
/// data-driven and eliminate repeated <c>CreateTestUserAsync(...)</c> calls.
/// </summary>
[ExcludeFromCodeCoverage]
public static class E2EUserFixtureCatalog
{
	/// <summary>
	/// Scenario users that exercise password, MFA enrollment, lockout,
	/// permission, and profile flows. The MFA user with backup codes is
	/// seeded separately because it requires TOTP secret + backup codes.
	/// </summary>
	public static IReadOnlyList<E2EUserFixture> ScenarioUsers { get; } =
		BuildScenarioUsers();

	/// <summary>
	/// Primary E2E users used across most authenticated test flows.
	/// </summary>
	public static IReadOnlyList<E2EUserFixture> PrimaryUsers { get; } =
		BuildPrimaryUsers();

	private static IReadOnlyList<E2EUserFixture> BuildScenarioUsers()
	{
		return
		[
			new E2EUserFixture(
				"e2e_pw_change",
				"e2e_pw_change@test.local",
				"E2E_PwChange_Password_123!",
				[RoleConstants.User]),
			new E2EUserFixture(
				"e2e_totp_enroll",
				"e2e_totp_enroll@test.local",
				"E2E_TotpEnroll_Password_123!",
				[RoleConstants.User]),
			new E2EUserFixture(
				"e2e_totp_viewer",
				"e2e_totp_viewer@test.local",
				"E2E_TotpViewer_Password_123!",
				[RoleConstants.User]),
			new E2EUserFixture(
				"e2e_backup_codes",
				"e2e_backup_codes@test.local",
				"E2E_BackupCodes_Password_123!",
				[RoleConstants.User]),
			new E2EUserFixture(
				"e2e_forgot_pw",
				"e2e_forgot_pw@test.local",
				"E2E_ForgotPw_Password_123!",
				[RoleConstants.User]),
			new E2EUserFixture(
				"e2e_lockout",
				"e2e_lockout@test.local",
				"E2E_Lockout_Password_123!",
				[RoleConstants.User]),
			new E2EUserFixture(
				"e2e_concurrent",
				"e2e_concurrent@test.local",
				"E2E_Concurrent_Password_123!",
				[RoleConstants.User]),
			new E2EUserFixture(
				"e2e_perm_approve",
				"e2e_perm_approve@test.local",
				"E2E_PermApprove_Password_123!",
				[RoleConstants.User]),
			new E2EUserFixture(
				"e2e_perm_reject",
				"e2e_perm_reject@test.local",
				"E2E_PermReject_Password_123!",
				[RoleConstants.User]),
			new E2EUserFixture(
				"e2e_profile_edit",
				"e2e_profile_edit@test.local",
				"E2E_ProfileEdit_Password_123!",
				[RoleConstants.User]),
			new E2EUserFixture(
				"e2e_crosstab",
				"e2e_crosstab@test.local",
				"E2E_CrossTab_Password_123!",
				[RoleConstants.User]),
		];
	}

	private static IReadOnlyList<E2EUserFixture> BuildPrimaryUsers()
	{
		return
		[
			new E2EUserFixture(
				"e2e_user",
				"e2e_user@test.local",
				"E2E_User_Password_123!",
				[RoleConstants.User]),
			new E2EUserFixture(
				"e2e_admin",
				"e2e_admin@test.local",
				"E2E_Admin_Password_123!",
				[RoleConstants.User, RoleConstants.Admin]),
			new E2EUserFixture(
				"e2e_developer",
				"e2e_developer@test.local",
				"E2E_Developer_Password_123!",
				[RoleConstants.User, RoleConstants.Developer]),
		];
	}
}

/// <summary>
/// Declarative fixture record describing a basic (non-MFA, non-forced-pw)
/// E2E test user.
/// </summary>
/// <param name="Username">The user's username.</param>
/// <param name="Email">The user's email address.</param>
/// <param name="Password">The user's plaintext password.</param>
/// <param name="Roles">The roles the user should be assigned.</param>
[ExcludeFromCodeCoverage]
public sealed record E2EUserFixture(
	string Username,
	string Email,
	string Password,
	IReadOnlyList<string> Roles);