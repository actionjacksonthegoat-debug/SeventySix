// <copyright file="E2ETestSeeder.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics.CodeAnalysis;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using SeventySix.Identity;
using SeventySix.Identity.Constants;

namespace SeventySix.Api.Seeders;

/// <summary>
/// Seeds test users for E2E testing environment.
/// Only runs when E2ESeeder:Enabled is true (Test environment).
/// </summary>
/// <param name="userManager">
/// The ASP.NET Identity user manager.
/// </param>
/// <param name="options">
/// The E2E seeder configuration options.
/// </param>
/// <param name="timeProvider">
/// The time provider for generating timestamps.
/// </param>
/// <param name="backupCodeHasher">
/// The password hasher for backup code hashing.
/// </param>
/// <param name="identityDbContext">
/// The identity database context for seeding backup codes.
/// </param>
/// <param name="logger">
/// The logger instance.
/// </param>
[ExcludeFromCodeCoverage]
public sealed class E2ETestSeeder(
	UserManager<ApplicationUser> userManager,
	IOptions<E2ESeederSettings> options,
	TimeProvider timeProvider,
	IPasswordHasher<BackupCode> backupCodeHasher,
	IdentityDbContext identityDbContext,
	TotpSecretProtector totpSecretProtector,
	ILogger<E2ETestSeeder> logger) : IHostedService
{
	/// <summary>
	/// Creates E2E test users on application startup.
	/// </summary>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public async Task StartAsync(CancellationToken cancellationToken)
	{
		if (!options.Value.Enabled)
		{
			return;
		}

		await CreateTestUserAsync(
			"e2e_user",
			"e2e_user@test.local",
			"E2E_User_Password_123!",
			[RoleConstants.User]);

		await CreateTestUserAsync(
			"e2e_admin",
			"e2e_admin@test.local",
			"E2E_Admin_Password_123!",
			[RoleConstants.User, RoleConstants.Admin]);

		await CreateTestUserAsync(
			"e2e_developer",
			"e2e_developer@test.local",
			"E2E_Developer_Password_123!",
			[RoleConstants.User, RoleConstants.Developer]);

		await CreateForcedPasswordChangeUserAsync();

		await CreateForcedPasswordChangeUserAsync(
			"e2e_force_pw_lifecycle",
			"e2e_force_pw_lifecycle@test.local",
			"E2E_ForcePwLife_Password_123!");

		await CreateTestUserAsync(
			"e2e_pw_change",
			"e2e_pw_change@test.local",
			"E2E_PwChange_Password_123!",
			[RoleConstants.User]);

		await CreateTestUserAsync(
			"e2e_totp_enroll",
			"e2e_totp_enroll@test.local",
			"E2E_TotpEnroll_Password_123!",
			[RoleConstants.User]);

		await CreateTestUserAsync(
			"e2e_totp_viewer",
			"e2e_totp_viewer@test.local",
			"E2E_TotpViewer_Password_123!",
			[RoleConstants.User]);

		await CreateTestUserAsync(
			"e2e_backup_codes",
			"e2e_backup_codes@test.local",
			"E2E_BackupCodes_Password_123!",
			[RoleConstants.User]);

		await CreateTestUserAsync(
			"e2e_forgot_pw",
			"e2e_forgot_pw@test.local",
			"E2E_ForgotPw_Password_123!",
			[RoleConstants.User]);

		await CreateMfaTestUserAsync();

		await CreateTestUserAsync(
			"e2e_lockout",
			"e2e_lockout@test.local",
			"E2E_Lockout_Password_123!",
			[RoleConstants.User]);

		await CreateTestUserAsync(
			"e2e_concurrent",
			"e2e_concurrent@test.local",
			"E2E_Concurrent_Password_123!",
			[RoleConstants.User]);

		await CreateTestUserAsync(
			"e2e_perm_approve",
			"e2e_perm_approve@test.local",
			"E2E_PermApprove_Password_123!",
			[RoleConstants.User]);

		await CreateTestUserAsync(
			"e2e_profile_edit",
			"e2e_profile_edit@test.local",
			"E2E_ProfileEdit_Password_123!",
			[RoleConstants.User]);

		await CreateTestUserAsync(
			"e2e_crosstab",
			"e2e_crosstab@test.local",
			"E2E_CrossTab_Password_123!",
			[RoleConstants.User]);
	}

	/// <summary>
	/// No-op for cleanup.
	/// </summary>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A completed task.
	/// </returns>
	public Task StopAsync(CancellationToken cancellationToken) =>
		Task.CompletedTask;

	private async Task CreateTestUserAsync(
		string username,
		string email,
		string password,
		IEnumerable<string> roles)
	{
		ApplicationUser? existingUser =
			await userManager.FindByNameAsync(username);

		if (existingUser is not null)
		{
			// User already exists - expected on subsequent runs
			return;
		}

		ApplicationUser newUser =
			new()
			{
				UserName = username,
				Email = email,
				EmailConfirmed = true,
				LockoutEnabled = true,
				CreateDate = timeProvider.GetUtcNow(),

				// E2E non-MFA users: explicitly opt out (entity default is true)
				MfaEnabled = false,
			};

		IdentityResult createResult =
			await userManager.CreateAsync(
				newUser,
				password);

		if (!createResult.Succeeded)
		{
			logger.LogError(
				"Failed to create E2E user {Username}: {Errors}",
				username,
				string.Join(
					", ",
					createResult.Errors.Select(
						error => error.Description)));
			return;
		}

		IdentityResult roleResult =
			await userManager.AddToRolesAsync(
				newUser,
				roles);

		if (!roleResult.Succeeded)
		{
			logger.LogError(
				"Failed to assign roles to E2E user {Username}: {Errors}",
				username,
				string.Join(
					", ",
					roleResult.Errors.Select(
						error => error.Description)));
		}
	}

	/// <summary>
	/// Creates or resets the forced password change test user.
	/// On each startup, ensures <c>RequiresPasswordChange</c> is <c>true</c>
	/// so tests are idempotent even after a previous run changed the password.
	/// </summary>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	private async Task CreateForcedPasswordChangeUserAsync(
		string username = "e2e_force_pw",
		string email = "e2e_force_pw@test.local",
		string password = "E2E_ForcePw_Password_123!")
	{
		ApplicationUser? existingUser =
			await userManager.FindByNameAsync(username);

		if (existingUser is not null)
		{
			if (!existingUser.RequiresPasswordChange)
			{
				existingUser.RequiresPasswordChange = true;
				await userManager.UpdateAsync(existingUser);
			}

			return;
		}

		ApplicationUser newUser =
			new()
			{
				UserName = username,
				Email = email,
				EmailConfirmed = true,
				LockoutEnabled = true,
				CreateDate = timeProvider.GetUtcNow(),
				RequiresPasswordChange = true,

				// E2E forced-pw users: explicitly opt out of MFA (entity default is true)
				MfaEnabled = false,
			};

		IdentityResult createResult =
			await userManager.CreateAsync(
				newUser,
				password);

		if (!createResult.Succeeded)
		{
			logger.LogError(
				"Failed to create E2E forced password change user: {Errors}",
				string.Join(
					", ",
					createResult.Errors.Select(
						error => error.Description)));
			return;
		}

		await userManager.AddToRolesAsync(
			newUser,
			[RoleConstants.User]);
	}

	/// <summary>
	/// Creates an MFA-enabled test user with a known TOTP secret and backup codes.
	/// The TOTP secret is a deterministic Base32-encoded value so E2E tests
	/// can compute valid TOTP codes.
	/// </summary>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	private async Task CreateMfaTestUserAsync()
	{
		const string mfaUsername = "e2e_mfa_user";

		ApplicationUser? existingUser =
			await userManager.FindByNameAsync(mfaUsername);

		if (existingUser is not null)
		{
			return;
		}

		DateTimeOffset now =
			timeProvider.GetUtcNow();

		ApplicationUser mfaUser =
			new()
			{
				UserName = mfaUsername,
				Email = "e2e_mfa_user@test.local",
				EmailConfirmed = true,
				LockoutEnabled = true,
				CreateDate = now,
				MfaEnabled = true,
				TotpSecret =
					totpSecretProtector.Protect(
						E2ESeederConstants.MfaTotpSecret),
				TotpEnrolledAt = now,
			};

		IdentityResult createResult =
			await userManager.CreateAsync(
				mfaUser,
				"E2E_Mfa_Password_123!");

		if (!createResult.Succeeded)
		{
			logger.LogError(
				"Failed to create E2E MFA user: {Errors}",
				string.Join(
					", ",
					createResult.Errors.Select(
						error => error.Description)));
			return;
		}

		await userManager.AddToRolesAsync(
			mfaUser,
			[RoleConstants.User]);

		await SeedBackupCodesAsync(
			mfaUser.Id,
			now);
	}

	/// <summary>
	/// Seeds known backup codes for the MFA test user.
	/// Codes are hashed using the same hasher as production.
	/// </summary>
	/// <param name="userId">
	/// The user ID to create backup codes for.
	/// </param>
	/// <param name="createdAt">
	/// The creation timestamp.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	private async Task SeedBackupCodesAsync(
		long userId,
		DateTimeOffset createdAt)
	{
		foreach (string plainCode in E2ESeederConstants.MfaBackupCodes)
		{
			BackupCode backupCode =
				new()
				{
					UserId = userId,
					CodeHash = backupCodeHasher.HashPassword(
						new BackupCode(),
						plainCode),
					IsUsed = false,
					CreateDate = createdAt,
				};

			identityDbContext.BackupCodes.Add(backupCode);
		}

		await identityDbContext.SaveChangesAsync();
	}
}

/// <summary>
/// Constants for E2E test seeder.
/// Known values that Playwright tests use to compute TOTP codes and backup codes.
/// </summary>
[ExcludeFromCodeCoverage]
public static class E2ESeederConstants
{
	/// <summary>
	/// Known Base32-encoded TOTP secret for the MFA test user.
	/// Playwright tests use this to generate valid TOTP codes via otpauth.
	/// </summary>
	public const string MfaTotpSecret =
		"JBSWY3DPEHPK3PXP";

	/// <summary>
	/// Known plain-text backup codes for the MFA test user.
	/// Hashed during seeding; Playwright tests submit these as-is.
	/// </summary>
	public static readonly string[] MfaBackupCodes =
		["E2EBAK01", "E2EBAK02", "E2EBAK03", "E2EBAK04", "E2EBAK05"];
}

/// <summary>
/// Configuration options for E2E test seeder.
/// </summary>
public sealed record E2ESeederSettings
{
	/// <summary>
	/// Gets or sets whether E2E seeder is enabled.
	/// </summary>
	public bool Enabled { get; init; }
}