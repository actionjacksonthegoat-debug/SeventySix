// <copyright file="ApiTrackingDbContext.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Persistence;

namespace SeventySix.ApiTracking;

/// <summary>
/// Database context for the ApiTracking bounded context.
/// </summary>
/// <remarks>
/// Manages ThirdPartyApiRequest entities and their database operations.
/// Uses PostgreSQL with schema 'ApiTracking' for isolation.
/// Inherits common configuration from BaseDbContext.
///
/// Design Patterns:
/// - Unit of Work: Coordinates changes to multiple entities
/// - Repository: Provides data access abstraction
/// - Template Method: Inherits from BaseDbContext
///
/// SOLID Principles:
/// - SRP: Only responsible for ApiTracking domain data access
/// - OCP: Can be extended with new entity configurations
/// </remarks>
public class ApiTrackingDbContext : BaseDbContext<ApiTrackingDbContext>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="ApiTrackingDbContext"/> class.
	/// </summary>
	/// <param name="options">The options for this context.</param>
	public ApiTrackingDbContext(DbContextOptions<ApiTrackingDbContext> options)
		: base(options) { }

	/// <summary>
	/// Gets or sets the ThirdPartyApiRequests DbSet.
	/// </summary>
	public DbSet<ThirdPartyApiRequest> ThirdPartyApiRequests =>
		Set<ThirdPartyApiRequest>();

	/// <summary>
	/// Gets the schema name for ApiTracking bounded context.
	/// </summary>
	/// <returns>"ApiTracking".</returns>
	protected override string GetSchemaName() => SchemaConstants.ApiTracking;
}