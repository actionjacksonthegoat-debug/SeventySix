// <copyright file="ApplicationDbContext.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using SeventySix.Core.Entities;

namespace SeventySix.Data;

/// <summary>
/// Entity Framework Core database context for SeventySix application.
/// </summary>
/// <remarks>
/// Manages entity sets, change tracking, and database operations.
///
/// Design Patterns:
/// - Unit of Work: Coordinates multiple repository operations in a single transaction
/// - Repository: Provides DbSet collections for entity access
///
/// SOLID Principles:
/// - SRP: Only responsible for database context management
/// - OCP: Extensible through additional DbSets and configurations
/// - DIP: Depends on Entity Framework Core abstractions
///
/// Performance Optimizations:
/// - Connection pooling (enabled by default)
/// - Automatic timestamp updates in SaveChangesAsync
/// - Fluent API configuration for explicit mappings
/// </remarks>
public class ApplicationDbContext : DbContext
{
	/// <summary>
	/// Initializes a new instance of the <see cref="ApplicationDbContext"/> class.
	/// </summary>
	/// <param name="options">The options to be used by the DbContext.</param>
	public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
		: base(options)
	{
	}

	/// <summary>
	/// Gets the DbSet for ThirdPartyApiRequest entities.
	/// </summary>
	public DbSet<ThirdPartyApiRequest> ThirdPartyApiRequests => Set<ThirdPartyApiRequest>();

	/// <summary>
	/// Configures the model that was discovered by convention from the entity types.
	/// </summary>
	/// <param name="modelBuilder">The builder being used to construct the model for this context.</param>
	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		ArgumentNullException.ThrowIfNull(modelBuilder);

		base.OnModelCreating(modelBuilder);

		// Apply all entity configurations from this assembly
		modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

		// Apply PostgreSQL-specific xmin mapping if using PostgreSQL
		if (Database.IsNpgsql())
		{
			var entity = modelBuilder.Entity<ThirdPartyApiRequest>();
			entity.Property(e => e.RowVersion)
				.HasColumnName("xmin")
				.HasColumnType("xid");
		}
	}

	/// <summary>
	/// Saves all changes made in this context to the database asynchronously.
	/// </summary>
	/// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe while waiting for the task to complete.</param>
	/// <returns>A task that represents the asynchronous save operation. The task result contains the number of state entries written to the database.</returns>
	/// <remarks>
	/// Automatically updates CreatedAt and UpdatedAt timestamps for auditing.
	/// This ensures consistent timestamp management across all entities.
	/// </remarks>
	public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
	{
		UpdateTimestamps();
		return await base.SaveChangesAsync(cancellationToken);
	}

	/// <summary>
	/// Updates CreatedAt and UpdatedAt timestamps for entities being added or modified.
	/// </summary>
	private void UpdateTimestamps()
	{
		var entries = ChangeTracker.Entries()
			.Where(e => e.Entity is ThirdPartyApiRequest &&
						(e.State == EntityState.Added || e.State == EntityState.Modified));

		foreach (var entry in entries)
		{
			var entity = (ThirdPartyApiRequest)entry.Entity;
			var now = DateTime.UtcNow;

			if (entry.State == EntityState.Added)
			{
				entity.CreatedAt = now;
				entity.UpdatedAt = now;
			}
			else if (entry.State == EntityState.Modified)
			{
				entity.UpdatedAt = now;
			}
		}
	}
}
