// <copyright file="AdminSeederService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Identity.Constants;
using SeventySix.Identity.Settings;
using SeventySix.Shared.Constants;

namespace SeventySix.Identity;

/// <summary>
/// Background service that seeds the initial admin user on application startup.
/// </summary>
/// <remarks>
/// Design Principles:
/// - Runs once at startup (not periodic)
/// - Idempotent: Safe to run multiple times
/// - Creates admin with password requiring change on first login
/// - Only creates if configured and no admin user exists
/// </remarks>
public class AdminSeederService(
	IServiceScopeFactory scopeFactory,
	IOptions<AdminSeederSettings> settings,
	TimeProvider timeProvider,
	ILogger<AdminSeederService> logger) : BackgroundService
{
	/// <inheritdoc/>
	protected override async Task ExecuteAsync(CancellationToken stoppingToken)
	{
		if (!settings.Value.Enabled)
		{
			return;
		}

		try
		{
			await SeedAdminUserAsync(stoppingToken);
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Failed to seed admin user");
		}
	}

	/// <summary>
	/// Seeds the initial admin user if not present and if enabled in settings.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	internal async Task SeedAdminUserAsync(CancellationToken cancellationToken)
	{
		using IServiceScope scope =
			scopeFactory.CreateScope();

		UserManager<ApplicationUser> userManager =
			scope.ServiceProvider.GetRequiredService<
				UserManager<ApplicationUser>>();

		RoleManager<ApplicationRole> roleManager =
			scope.ServiceProvider.GetRequiredService<
				RoleManager<ApplicationRole>>();

		// Check if admin user already exists
		ApplicationUser? existingAdmin =
			await userManager.FindByNameAsync(
				settings.Value.Username);

		if (existingAdmin is not null)
		{
			// Admin already exists - do not modify their password change status
			// The requires-password-change flag is managed by the change-password flow
			return;
		}

		// Check if any user has admin role
		IList<ApplicationUser> usersInAdminRole =
			await userManager.GetUsersInRoleAsync(RoleConstants.Admin);

		if (usersInAdminRole.Count > 0)
		{
			return;
		}

		// Ensure Admin role exists
		ApplicationRole? adminRole =
			await roleManager.FindByNameAsync(
				RoleConstants.Admin);

		if (adminRole is null)
		{
			logger.LogError(
				"Admin role not found in Roles - cannot assign role to seeded admin user");
			return;
		}

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		await CreateAdminUserAsync(
			userManager);
	}

	/// <summary>
	/// Creates the admin user with configured settings.
	/// </summary>
	/// <param name="userManager">
	/// User manager for user operations.
	/// </param>
	private async Task<bool> CreateAdminUserAsync(
		UserManager<ApplicationUser> userManager)
	{
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		ApplicationUser adminUser =
			new()
			{
				UserName = settings.Value.Username,
				Email = settings.Value.Email,
				FullName =
					settings.Value.FullName ?? "System Administrator",
				IsActive = true,
				CreateDate = now,
				CreatedBy =
					AuditConstants.SystemUser,
				RequiresPasswordChange = true,
			};

		IdentityResult createResult =
			await userManager.CreateAsync(
				adminUser,
				settings.Value.InitialPassword);

		if (!createResult.Succeeded)
		{
			string errors = createResult.ToErrorString();
			logger.LogError(
				"Failed to create admin user: {Errors}",
				errors);

			return false;
		}
		IdentityResult roleResult =
			await userManager.AddToRoleAsync(
				adminUser,
				RoleConstants.Admin);

		if (!roleResult.Succeeded)
		{
			string errors = roleResult.ToErrorString();
			logger.LogError(
				"Failed to assign admin role: {Errors}",
				errors);

			return false;
		}

		logger.LogWarning(
			"Initial admin user '{Username}' created with temporary password. "
				+ "Password change required on first login.",
			settings.Value.Username);

		return true;
	}
}