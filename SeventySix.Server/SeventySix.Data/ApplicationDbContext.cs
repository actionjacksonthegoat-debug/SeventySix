// <copyright file="ApplicationDbContext.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SeventySix.BusinessLogic.Entities;

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
/// <remarks>
/// Initializes a new instance of the <see cref="ApplicationDbContext"/> class.
/// </remarks>
/// <param name="options">The options to be used by the DbContext.</param>
public class ApplicationDbContext(
	DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
	/// <summary>
	/// Gets the DbSet for ThirdPartyApiRequest entities.
	/// </summary>
	public DbSet<ThirdPartyApiRequest> ThirdPartyApiRequests => Set<ThirdPartyApiRequest>();

	/// <summary>
	/// Gets the DbSet for Log entities.
	/// </summary>
	public DbSet<Log> Logs => Set<Log>();

	/// <summary>
	/// Gets the DbSet for User entities.
	/// </summary>
	public DbSet<User> Users => Set<User>();

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
			EntityTypeBuilder<ThirdPartyApiRequest> apiRequestEntity = modelBuilder.Entity<ThirdPartyApiRequest>();
			apiRequestEntity.Property(e => e.RowVersion)
				.HasColumnName("xmin")
				.HasColumnType("xid");

			EntityTypeBuilder<User> userEntity = modelBuilder.Entity<User>();
			userEntity.Property(e => e.RowVersion)
				.HasColumnName("xmin")
				.HasColumnType("xid")
				.ValueGeneratedOnAddOrUpdate();
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
		IEnumerable<EntityEntry> entries = ChangeTracker.Entries()
			.Where(e => (e.Entity is ThirdPartyApiRequest || e.Entity is Log || e.Entity is User) &&
						(e.State == EntityState.Added || e.State == EntityState.Modified));

		foreach (EntityEntry? entry in entries)
		{
			DateTime now = DateTime.UtcNow;

			if (entry.Entity is ThirdPartyApiRequest apiRequest)
			{
				if (entry.State == EntityState.Added)
				{
					apiRequest.CreatedAt = now;
					apiRequest.UpdatedAt = now;
				}
				else if (entry.State == EntityState.Modified)
				{
					apiRequest.UpdatedAt = now;
				}
			}
			else if (entry.Entity is Log log)
			{
				if (entry.State == EntityState.Added && log.Timestamp == default)
				{
					log.Timestamp = now;
				}
			}
			else if (entry.Entity is User user)
			{
				if (entry.State == EntityState.Added)
				{
					user.CreatedAt = now;
					// For SQLite tests, set a default RowVersion if not set
					if (!user.RowVersion.HasValue)
					{
						user.RowVersion = 1;
					}
				}
				else if (entry.State == EntityState.Modified)
				{
					user.ModifiedAt = now;
				}
			}
		}
	}
}