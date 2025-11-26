// <copyright file="ApiTrackingDbContext.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;

namespace SeventySix.ApiTracking;

/// <summary>
/// Database context for the ApiTracking bounded context.
/// </summary>
/// <remarks>
/// Manages ThirdPartyApiRequest entities and their database operations.
/// Uses PostgreSQL with schema 'api_tracking' for isolation.
///
/// Design Patterns:
/// - Unit of Work: Coordinates changes to multiple entities
/// - Repository: Provides data access abstraction
///
/// SOLID Principles:
/// - SRP: Only responsible for ApiTracking domain data access
/// - OCP: Can be extended with new entity configurations
/// </remarks>
public class ApiTrackingDbContext : DbContext
{
	/// <summary>
	/// Initializes a new instance of the <see cref="ApiTrackingDbContext"/> class.
	/// </summary>
	/// <param name="options">The options for this context.</param>
	public ApiTrackingDbContext(DbContextOptions<ApiTrackingDbContext> options)
		: base(options)
	{
	}

	/// <summary>
	/// Gets or sets the ThirdPartyApiRequests DbSet.
	/// </summary>
	public DbSet<ThirdPartyApiRequest> ThirdPartyApiRequests => Set<ThirdPartyApiRequest>();

	/// <summary>
	/// Configures the model for this context.
	/// </summary>
	/// <param name="modelBuilder">The builder being used to construct the model for this context.</param>
	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		ArgumentNullException.ThrowIfNull(modelBuilder);

		// Set default schema for ApiTracking bounded context
		modelBuilder.HasDefaultSchema("ApiTracking");

		// ONLY apply configurations from ApiTracking namespace (bounded context isolation)
		modelBuilder.ApplyConfigurationsFromAssembly(
			typeof(ApiTrackingDbContext).Assembly,
			t => t.Namespace != null && t.Namespace.StartsWith("SeventySix.ApiTracking"));

		base.OnModelCreating(modelBuilder);
	}
}
