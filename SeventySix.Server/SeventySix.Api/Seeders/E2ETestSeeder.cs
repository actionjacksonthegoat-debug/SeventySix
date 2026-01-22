// <copyright file="E2ETestSeeder.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

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
/// <param name="logger">
/// The logger instance.
/// </param>
public class E2ETestSeeder(
	UserManager<ApplicationUser> userManager,
	IOptions<E2ESeederOptions> options,
	TimeProvider timeProvider,
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
				CreateDate = timeProvider.GetUtcNow().UtcDateTime
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
}

/// <summary>
/// Configuration options for E2E test seeder.
/// </summary>
public record E2ESeederOptions
{
	/// <summary>
	/// Gets or sets whether E2E seeder is enabled.
	/// </summary>
	public bool Enabled { get; init; }
}