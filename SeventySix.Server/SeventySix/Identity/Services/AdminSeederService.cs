// <copyright file="AdminSeederService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Identity.Settings;

namespace SeventySix.Identity;

/// <summary>
/// Background service that seeds the initial admin user on application startup.
/// </summary>
/// <remarks>
/// Design Principles:
/// - Runs once at startup (not periodic)
/// - Idempotent: Safe to run multiple times
/// - Creates admin with PasswordChangedAt = null to force password change on first login
/// - Only creates if configured and no admin user exists
/// </remarks>
public class AdminSeederService(
	IServiceScopeFactory scopeFactory,
	IOptions<AdminSeederSettings> settings,
	ILogger<AdminSeederService> logger) : BackgroundService
{
	/// <inheritdoc/>
	protected override async Task ExecuteAsync(CancellationToken stoppingToken)
	{
		if (!settings.Value.Enabled)
		{
			logger.LogInformation("Admin seeding is disabled");
			return;
		}

		try
		{
			await SeedAdminUserAsync(stoppingToken);
		}
		catch (Exception ex)
		{
			logger.LogError(
				ex,
				"Failed to seed admin user");
		}
	}

	private async Task SeedAdminUserAsync(CancellationToken cancellationToken)
	{
		using IServiceScope scope =
			scopeFactory.CreateScope();

		IdentityDbContext context =
			scope.ServiceProvider.GetRequiredService<IdentityDbContext>();

		// Check if admin user already exists
		bool adminExists =
			await context.Users
				.IgnoreQueryFilters()
				.AnyAsync(
					u => u.Username == settings.Value.Username,
					cancellationToken);

		if (adminExists)
		{
			logger.LogDebug(
				"Admin user '{Username}' already exists, skipping seed",
				settings.Value.Username);
			return;
		}

		// Check if any admin role exists (may have been created through other means)
		bool anyAdminRoleExists =
			await context.UserRoles
				.Include(userRole => userRole.Role)
				.AnyAsync(
					userRole => userRole.Role!.Name == "Admin",
					cancellationToken);

		if (anyAdminRoleExists)
		{
			logger.LogInformation(
				"Admin role already assigned to a user, skipping seed");
			return;
		}

		DateTime now =
			DateTime.UtcNow;

		// Create admin user
		User adminUser =
			new()
			{
				Username = settings.Value.Username,
				Email = settings.Value.Email,
				FullName = settings.Value.FullName ?? "System Administrator",
				IsActive = true,
				CreateDate = now,
				CreatedBy = "System"
			};

		context.Users.Add(adminUser);
		await context.SaveChangesAsync(cancellationToken);

		// Create credential with temporary password
		// PasswordChangedAt = null forces password change on first login
		string passwordHash =
			BCrypt.Net.BCrypt.HashPassword(
				settings.Value.InitialPassword,
				settings.Value.WorkFactor);

		UserCredential credential =
			new()
			{
				UserId = adminUser.Id,
				PasswordHash = passwordHash,
				PasswordChangedAt = null, // Forces password change on first login
				CreateDate = now
			};

		context.UserCredentials.Add(credential);

		// Look up Admin role ID from SecurityRoles
		int? adminRoleId =
			await context.SecurityRoles
				.Where(securityRole => securityRole.Name == "Admin")
				.Select(securityRole => (int?)securityRole.Id)
				.FirstOrDefaultAsync(cancellationToken);

		if (adminRoleId is null)
		{
			logger.LogError("Admin role not found in SecurityRoles - cannot assign role to seeded admin user");
			return;
		}

		// Assign Admin role - CreateDate/CreatedBy set by AuditInterceptor
		UserRole adminRole =
			new()
			{
				UserId = adminUser.Id,
				RoleId = adminRoleId.Value
			};

		context.UserRoles.Add(adminRole);
		await context.SaveChangesAsync(cancellationToken);

		logger.LogWarning(
			"Initial admin user '{Username}' created with temporary password. Password change required on first login.",
			settings.Value.Username);
	}
}