// <copyright file="WeatherForecastRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Domain.Entities;
using SeventySix.Domain.Interfaces;

namespace SeventySix.Infrastructure.Repositories;

/// <summary>
/// In-memory implementation of the weather forecast repository.
/// Provides a simple data store for demonstration and testing purposes.
/// </summary>
/// <remarks>
/// This is a temporary implementation using an in-memory collection.
/// In production, this should be replaced with a persistent data store.
///
/// Current Implementation:
/// - Uses List&lt;WeatherForecast&gt; for storage
/// - Data is lost on application restart
/// - Not thread-safe (would need locking for concurrent access)
/// - No query optimization (full table scans)
///
/// Production Considerations:
/// Replace with:
/// - Entity Framework Core with SQL Server/PostgreSQL
/// - Dapper for high-performance scenarios
/// - NoSQL database (MongoDB, CosmosDB) for document storage
/// - Redis for caching layer
///
/// Missing Features (to add in production):
/// - Actual database persistence
/// - Connection pooling
/// - Transaction management
/// - Optimistic concurrency control
/// - Query optimization (indexes, compiled queries)
/// - Audit logging (created/modified timestamps)
/// - Soft delete support
/// - Unit of Work pattern
///
/// Design Patterns:
/// - Repository Pattern: Abstracts data access
/// - Dependency Inversion: Implements domain interface
///
/// Note: Seeds with 5 sample forecasts on initialization for demo purposes.
/// </remarks>
public class WeatherForecastRepository : IWeatherForecastRepository
{
	/// <summary>
	/// In-memory storage for forecast entities.
	/// </summary>
	/// <remarks>
	/// WARNING: This is not thread-safe. For concurrent access, wrap operations in locks
	/// or use ConcurrentBag/ConcurrentDictionary.
	/// </remarks>
	private readonly List<WeatherForecast> Forecasts = [];

	/// <summary>
	/// Counter for generating unique IDs.
	/// </summary>
	/// <remarks>
	/// Currently not used as entities use Date as identifier.
	/// In production with real DB, this would be handled by auto-increment/identity columns.
	/// </remarks>
	private int NextId = 1;

	/// <summary>
	/// Initializes a new instance of the <see cref="WeatherForecastRepository"/> class.
	/// </summary>
	/// <remarks>
	/// Constructor seeds the repository with 5 sample forecast records for demonstration.
	/// In production, seeding should be handled by:
	/// - Database migrations
	/// - Separate seed data scripts
	/// - Configuration/startup initialization
	/// </remarks>
	public WeatherForecastRepository()
	{
		SeedData();
	}

	/// <inheritdoc/>
	/// <remarks>
	/// Returns a copy of the collection to prevent external modification.
	/// In production with EF Core, this would use AsNoTracking() for read-only queries.
	/// </remarks>
	public Task<IEnumerable<WeatherForecast>> GetAllAsync(CancellationToken cancellationToken = default)
	{
		return Task.FromResult<IEnumerable<WeatherForecast>>(Forecasts.ToList());
	}

	/// <inheritdoc/>
	/// <remarks>
	/// Current implementation uses Date as the identifier (DayNumber).
	/// Returns null if forecast not found (caller handles this).
	///
	/// Production Note: With proper ID column, this would be a simple indexed lookup.
	/// </remarks>
	public Task<WeatherForecast?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
	{
		var forecast = Forecasts.FirstOrDefault(f => f.Date == DateOnly.FromDayNumber(id));
		return Task.FromResult(forecast);
	}

	/// <inheritdoc/>
	/// <exception cref="ArgumentNullException">Thrown when entity is null.</exception>
	/// <remarks>
	/// Simply adds to the in-memory list.
	///
	/// Production Implementation with EF Core:
	/// <code>
	/// await _context.WeatherForecasts.AddAsync(entity, cancellationToken);
	/// await _context.SaveChangesAsync(cancellationToken);
	/// return entity;
	/// </code>
	///
	/// Missing Features:
	/// - Duplicate detection (same date check)
	/// - Validation before persistence
	/// - Audit fields (CreatedDate, CreatedBy)
	/// - Transaction handling
	/// </remarks>
	public Task<WeatherForecast> CreateAsync(WeatherForecast entity, CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(entity);

		Forecasts.Add(entity);
		NextId++;
		return Task.FromResult(entity);
	}

	/// <inheritdoc/>
	/// <exception cref="ArgumentNullException">Thrown when entity is null.</exception>
	/// <remarks>
	/// Uses Date as the identifier to find and update the entity.
	/// Replace-based update: removes old, adds new.
	///
	/// Production Implementation with EF Core:
	/// <code>
	/// _context.WeatherForecasts.Update(entity);
	/// await _context.SaveChangesAsync(cancellationToken);
	/// return entity;
	/// </code>
	///
	/// Missing Features:
	/// - Concurrency conflict detection
	/// - Partial updates (only changed fields)
	/// - Audit fields (ModifiedDate, ModifiedBy)
	/// - Entity existence check (should throw if not found)
	/// </remarks>
	public Task<WeatherForecast> UpdateAsync(WeatherForecast entity, CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(entity);

		var existing = Forecasts.FirstOrDefault(f => f.Date == entity.Date);
		if (existing is not null)
		{
			Forecasts.Remove(existing);
			Forecasts.Add(entity);
		}

		return Task.FromResult(entity);
	}

	/// <inheritdoc/>
	/// <remarks>
	/// Hard delete - permanently removes the entity.
	/// Returns false if entity not found.
	///
	/// Production Implementation with EF Core:
	/// <code>
	/// var entity = await _context.WeatherForecasts.FindAsync(id, cancellationToken);
	/// if (entity is null) return false;
	/// _context.WeatherForecasts.Remove(entity);
	/// await _context.SaveChangesAsync(cancellationToken);
	/// return true;
	/// </code>
	///
	/// Consider Soft Delete Instead:
	/// - Add IsDeleted bool property
	/// - Set flag instead of removing
	/// - Filter deleted entities in queries
	/// - Benefits: audit trail, data recovery, referential integrity
	/// </remarks>
	public Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
	{
		var forecast = Forecasts.FirstOrDefault(f => f.Date == DateOnly.FromDayNumber(id));
		if (forecast is null)
		{
			return Task.FromResult(false);
		}

		Forecasts.Remove(forecast);
		return Task.FromResult(true);
	}

	/// <summary>
	/// Seeds the repository with sample weather forecast data.
	/// </summary>
	/// <remarks>
	/// Creates 5 forecasts starting from today with random temperatures and summaries.
	///
	/// This is for demonstration purposes only. In production:
	/// - Use database migrations for schema and seed data
	/// - Load seed data from configuration files (JSON, YAML)
	/// - Use environment-specific seeding (dev vs production)
	/// - Consider using libraries like Bogus for test data generation
	///
	/// Seed Data Characteristics:
	/// - Dates: Today + 0-4 days
	/// - Temperature: Random between -20°C and 55°C
	/// - Summary: Random from predefined list
	/// </remarks>
	private void SeedData()
	{
		var summaries = new[]
		{
			"Freezing", "Bracing", "Chilly", "Cool", "Mild",
			"Warm", "Balmy", "Hot", "Sweltering", "Scorching",
		};

		var startDate = DateOnly.FromDateTime(DateTime.Now);
		for (int i = 0; i < 5; i++)
		{
			Forecasts.Add(new WeatherForecast
			{
				Date = startDate.AddDays(i),
				TemperatureC = Random.Shared.Next(-20, 55),
				Summary = summaries[Random.Shared.Next(summaries.Length)],
			});
		}
	}
}