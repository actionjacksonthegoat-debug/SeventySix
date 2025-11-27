// <copyright file="IdentityDbContext.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using SeventySix.Shared.Infrastructure;

namespace SeventySix.Identity;

/// <summary>
/// Entity Framework Core DbContext for Identity bounded context.
/// Manages User entities and their database operations.
/// </summary>
/// <remarks>
/// Inherits common configuration from BaseDbContext.
/// Provides "Identity" schema name and soft delete query filter for User entities.
/// </remarks>
public class IdentityDbContext : BaseDbContext<IdentityDbContext>
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
	/// Gets the schema name for Identity bounded context.
	/// </summary>
	/// <returns>"Identity".</returns>
	protected override string GetSchemaName() => "Identity";

	/// <summary>
	/// Configures entity-specific settings for Identity domain.
	/// </summary>
	/// <param name="modelBuilder">The model builder.</param>
	/// <remarks>
	/// Applies global query filter for soft delete on User entities.
	/// </remarks>
	protected override void ConfigureEntities(ModelBuilder modelBuilder)
	{
		// Global query filter for soft delete
		modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);
	}
}
