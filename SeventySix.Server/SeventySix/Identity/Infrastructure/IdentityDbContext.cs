// <copyright file="IdentityDbContext.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

/// <summary>
/// Entity Framework Core DbContext for Identity bounded context.
/// Manages User entities and their database operations.
/// </summary>
public class IdentityDbContext : DbContext
{
	/// <summary>
	/// Initializes a new instance of the <see cref="IdentityDbContext"/> class.
	/// </summary>
	/// <param name="options">The options for this context.</param>
	public IdentityDbContext(DbContextOptions<IdentityDbContext> options)
		: base(options)
	{
	}

	/// <summary>
	/// Gets or sets the Users DbSet.
	/// </summary>
	public DbSet<User> Users => Set<User>();

	/// <summary>
	/// Configures the model that was discovered by convention from the entity types.
	/// </summary>
	/// <param name="modelBuilder">The builder being used to construct the model for this context.</param>
	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		// Configure schema for Identity bounded context
		modelBuilder.HasDefaultSchema("Identity");

		// ONLY apply configurations from Identity namespace (bounded context isolation)
		modelBuilder.ApplyConfigurationsFromAssembly(
			typeof(IdentityDbContext).Assembly,
			t => t.Namespace != null && t.Namespace.StartsWith("SeventySix.Identity"));

		// Global query filter for soft delete
		modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);
	}
}
