// <copyright file="SecurityRoleConfigurationTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using SeventySix.Identity;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Configurations;

/// <summary>
/// Integration tests for <see cref="SecurityRoleConfiguration"/>.
/// </summary>
/// <remarks>
/// Validates FK constraints, RESTRICT delete behavior, and seeded data.
/// Uses Testcontainers with PostgreSQL for realistic integration testing.
/// </remarks>
[Collection("DatabaseTests")]
public class SecurityRoleConfigurationTests : DataPostgreSqlTestBase
{
	public SecurityRoleConfigurationTests(TestcontainersPostgreSqlFixture fixture)
		: base(fixture)
	{
	}

	[Fact]
	public async Task SecurityRoles_SeedsStandardRoles_OnMigrationAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();

		// Act
		List<SecurityRole> roles =
			await context.SecurityRoles
				.OrderBy(r => r.Id)
				.ToListAsync();

		// Assert - Three standard roles should be seeded
		roles.Count.ShouldBe(3);
		roles[0].Name.ShouldBe(TestRoleConstants.User);
		roles[1].Name.ShouldBe(TestRoleConstants.Developer);
		roles[2].Name.ShouldBe(TestRoleConstants.Admin);
	}

	[Fact]
	public async Task SecurityRole_UniqueNameConstraint_PreventsduplicatesAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();

		SecurityRole duplicateRole =
			new()
			{
				Name = TestRoleConstants.Developer, // Already seeded
				Description = "Duplicate attempt",
			};

		// Act & Assert - Unique constraint should prevent insert
		context.SecurityRoles.Add(duplicateRole);
		await Should.ThrowAsync<DbUpdateException>(
			() => context.SaveChangesAsync());
	}

	[Fact]
	public async Task DeleteSecurityRole_Fails_WhenUserRolesExistAsync()
	{
		// Arrange - Create user and assign role
		await using IdentityDbContext context = CreateIdentityDbContext();

		string testId = Guid.NewGuid().ToString("N")[..8];
		User user = new UserBuilder()
			.WithUsername($"restrict_{testId}")
			.WithEmail($"restrict_{testId}@example.com")
			.Build();
		await context.Users.AddAsync(user);
		await context.SaveChangesAsync();

		// Get the seeded Developer role
		SecurityRole? developerRole =
			await context.SecurityRoles
				.FirstOrDefaultAsync(r => r.Name == TestRoleConstants.Developer);
		developerRole.ShouldNotBeNull();

		// Assign role to user
		UserRole userRole =
			new()
			{
				UserId = user.Id,
				RoleId = developerRole.Id,
			};
		await context.UserRoles.AddAsync(userRole);
		await context.SaveChangesAsync();

		// Act & Assert - RESTRICT should prevent deletion at database level
		// Use raw SQL to bypass EF Core's in-memory tracking and test actual FK constraint
		await Should.ThrowAsync<Npgsql.PostgresException>(async () =>
			await context.Database.ExecuteSqlRawAsync(
				"""DELETE FROM "Identity"."SecurityRoles" WHERE "Id" = {0}""",
				developerRole.Id));
	}

	[Fact]
	public async Task DeleteSecurityRole_Fails_WhenPermissionRequestsExistAsync()
	{
		// Arrange - Create user and permission request
		await using IdentityDbContext context = CreateIdentityDbContext();

		string testId = Guid.NewGuid().ToString("N")[..8];
		User user = new UserBuilder()
			.WithUsername($"request_{testId}")
			.WithEmail($"request_{testId}@example.com")
			.Build();
		await context.Users.AddAsync(user);
		await context.SaveChangesAsync();

		// Get the seeded Admin role
		SecurityRole? adminRole =
			await context.SecurityRoles
				.FirstOrDefaultAsync(r => r.Name == TestRoleConstants.Admin);
		adminRole.ShouldNotBeNull();

		// Create permission request for that role
		PermissionRequest request =
			new()
			{
				UserId = user.Id,
				RequestedRoleId = adminRole.Id,
				CreatedBy = user.Username,
			};
		await context.PermissionRequests.AddAsync(request);
		await context.SaveChangesAsync();

		// Act & Assert - RESTRICT should prevent deletion at database level
		// Use raw SQL to bypass EF Core's in-memory tracking and test actual FK constraint
		await Should.ThrowAsync<Npgsql.PostgresException>(async () =>
			await context.Database.ExecuteSqlRawAsync(
				"""DELETE FROM "Identity"."SecurityRoles" WHERE "Id" = {0}""",
				adminRole.Id));
	}

	[Fact]
	public async Task DeleteSecurityRole_Succeeds_WhenNoReferencesExistAsync()
	{
		// Arrange - Create a new role with no references
		await using IdentityDbContext context = CreateIdentityDbContext();

		SecurityRole testRole =
			new()
			{
				Name = "TestRole",
				Description = "Temporary test role",
				IsActive = false,
			};
		await context.SecurityRoles.AddAsync(testRole);
		await context.SaveChangesAsync();

		int roleId = testRole.Id;

		// Act - Delete should succeed (no FK references)
		context.SecurityRoles.Remove(testRole);
		await context.SaveChangesAsync();

		// Assert
		SecurityRole? deletedRole =
			await context.SecurityRoles.FindAsync(roleId);
		deletedRole.ShouldBeNull();
	}

	[Fact]
	public async Task CreateUserRole_Fails_WhenRoleDoesNotExistAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();

		string testId = Guid.NewGuid().ToString("N")[..8];
		User user = new UserBuilder()
			.WithUsername($"norole_{testId}")
			.WithEmail($"norole_{testId}@example.com")
			.Build();
		await context.Users.AddAsync(user);
		await context.SaveChangesAsync();

		UserRole userRole =
			new()
			{
				UserId = user.Id,
				RoleId = 999999, // Non-existent role
			};

		// Act & Assert - FK constraint should prevent insert
		context.UserRoles.Add(userRole);
		await Should.ThrowAsync<DbUpdateException>(
			() => context.SaveChangesAsync());
	}
}