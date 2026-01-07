// <copyright file="IdentityDbContext.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SeventySix.Shared.Constants;

namespace SeventySix.Identity;

/// <summary>
/// Identity DbContext using ASP.NET Core Identity with custom user/role types.
/// </summary>
/// <remarks>
/// Extends IdentityDbContext to leverage ASP.NET Core Identity features while
/// maintaining custom entities (RefreshToken, PermissionRequest) for app-specific functionality.
/// </remarks>
public class IdentityDbContext
	: IdentityDbContext<
		ApplicationUser,
		ApplicationRole,
		long,
		IdentityUserClaim<long>,
		IdentityUserRole<long>,
		IdentityUserLogin<long>,
		IdentityRoleClaim<long>,
		IdentityUserToken<long>>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="IdentityDbContext"/> class.
	/// </summary>
	/// <param name="options">
	/// The options for this context.
	/// </param>
	public IdentityDbContext(DbContextOptions<IdentityDbContext> options)
		: base(options) { }

	/// <summary>
	/// Gets or sets the RefreshTokens DbSet.
	/// </summary>
	public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

	/// <summary>
	/// Gets or sets the PermissionRequests DbSet.
	/// </summary>
	public DbSet<PermissionRequest> PermissionRequests =>
		Set<PermissionRequest>();

	/// <inheritdoc/>
	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		base.OnModelCreating(modelBuilder);

		// Set schema for all Identity tables
		modelBuilder.HasDefaultSchema(
			SchemaConstants.Identity);

		// Rename Identity tables to match existing conventions
		modelBuilder
			.Entity<ApplicationUser>()
			.ToTable("Users");

		modelBuilder
			.Entity<ApplicationRole>()
			.ToTable("Roles");

		modelBuilder
			.Entity<IdentityUserRole<long>>()
			.ToTable("UserRoles");

		modelBuilder
			.Entity<IdentityUserClaim<long>>()
			.ToTable("UserClaims");

		modelBuilder
			.Entity<IdentityUserLogin<long>>()
			.ToTable("ExternalLogins");

		modelBuilder
			.Entity<IdentityRoleClaim<long>>()
			.ToTable("RoleClaims");

		modelBuilder
			.Entity<IdentityUserToken<long>>()
			.ToTable("UserTokens");

		// Apply custom configurations from this assembly
		modelBuilder.ApplyConfigurationsFromAssembly(
			typeof(IdentityDbContext).Assembly,
			type =>
				type.Namespace?.StartsWith(
					"SeventySix.Identity",
					StringComparison.Ordinal) == true);

		// Global query filter for soft delete
		modelBuilder
			.Entity<ApplicationUser>()
			.HasQueryFilter(user => !user.IsDeleted);
	}
}