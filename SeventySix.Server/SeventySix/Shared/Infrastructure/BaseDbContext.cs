// <copyright file="BaseDbContext.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;

namespace SeventySix.Shared.Infrastructure;

/// <summary>
/// Base database context providing common configuration for bounded contexts.
/// Implements Template Method pattern for consistent schema and configuration setup.
/// </summary>
/// <typeparam name="TContext">The concrete DbContext type.</typeparam>
/// <remarks>
/// This class eliminates ~60 lines of duplicated OnModelCreating logic across
/// IdentityDbContext, LoggingDbContext, and ApiTrackingDbContext.
///
/// Design Patterns:
/// - Template Method: OnModelCreating defines the algorithm, derived classes provide schema name
/// - Convention over Configuration: Automatically filters configurations by namespace
///
/// SOLID Principles:
/// - SRP: Only responsible for common DbContext configuration
/// - OCP: Open for extension via GetSchemaName, closed for modification
/// - DIP: Depends on DbContext abstraction
///
/// What Changes (per bounded context):
/// - Schema name ("Identity", "Logging", "ApiTracking")
/// - Namespace filter ("SeventySix.Identity", "SeventySix.Logging", etc.)
///
/// What Stays Same:
/// - Configuration discovery pattern (ApplyConfigurationsFromAssembly)
/// - Namespace-based filtering logic
/// - Base OnModelCreating flow
/// </remarks>
public abstract class BaseDbContext<TContext> : DbContext
	where TContext : DbContext
{
	/// <summary>
	/// Initializes a new instance of the <see cref="BaseDbContext{TContext}"/> class.
	/// </summary>
	/// <param name="options">The options for this context.</param>
	protected BaseDbContext(DbContextOptions<TContext> options)
		: base(options)
	{
	}

	/// <summary>
	/// Gets the schema name for this bounded context.
	/// </summary>
	/// <returns>The schema name (e.g., "Identity", "Logging", "ApiTracking").</returns>
	/// <remarks>
	/// Derived classes must implement this to provide their schema name.
	/// This is the primary extension point in the Template Method pattern.
	/// </remarks>
	protected abstract string GetSchemaName();

	/// <summary>
	/// Gets the namespace prefix for configuration filtering.
	/// </summary>
	/// <returns>The namespace prefix (e.g., "SeventySix.Identity").</returns>
	/// <remarks>
	/// Defaults to "SeventySix." + schema name for convention-based filtering.
	/// Override if namespace doesn't match schema name convention.
	/// </remarks>
	protected virtual string GetNamespacePrefix()
	{
		return $"SeventySix.{GetSchemaName()}";
	}

	/// <summary>
	/// Configures the model that was discovered by convention from the entity types.
	/// Template Method that applies schema and configuration filtering.
	/// </summary>
	/// <param name="modelBuilder">The builder being used to construct the model for this context.</param>
	/// <remarks>
	/// This method:
	/// 1. Sets the default schema for bounded context isolation
	/// 2. Applies configurations from assembly filtered by namespace
	/// 3. Calls ConfigureEntities for domain-specific configuration (soft delete, etc.)
	///
	/// Derived classes can override ConfigureEntities to add specific entity configurations
	/// like global query filters for soft delete.
	/// </remarks>
	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		ArgumentNullException.ThrowIfNull(modelBuilder);

		// Set default schema for bounded context isolation
		string schemaName = GetSchemaName();
		modelBuilder.HasDefaultSchema(schemaName);

		// Apply configurations from assembly filtered by namespace
		// This ensures only configurations from this bounded context are applied
		string namespacePrefix = GetNamespacePrefix();
		modelBuilder.ApplyConfigurationsFromAssembly(
			typeof(TContext).Assembly,
			type => type.Namespace != null && type.Namespace.StartsWith(namespacePrefix));

		// Allow derived classes to configure entity-specific settings
		ConfigureEntities(modelBuilder);

		base.OnModelCreating(modelBuilder);
	}

	/// <summary>
	/// Configures entity-specific settings like global query filters.
	/// </summary>
	/// <param name="modelBuilder">The model builder.</param>
	/// <remarks>
	/// Override this method to add domain-specific entity configurations such as:
	/// - Global query filters (soft delete, multi-tenancy)
	/// - Default values
	/// - Computed columns
	///
	/// Default implementation does nothing.
	/// </remarks>
	protected virtual void ConfigureEntities(ModelBuilder modelBuilder)
	{
		// Default: no additional configuration
		// Derived classes override to add global query filters, etc.
	}
}
