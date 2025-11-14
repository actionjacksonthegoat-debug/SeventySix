// <copyright file="UserRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Core.Entities;
using SeventySix.Core.Interfaces;

namespace SeventySix.DataAccess.Repositories;

/// <summary>
/// In-memory implementation of the user repository.
/// Provides a simple data store for demonstration and testing purposes.
/// </summary>
/// <remarks>
/// This is a temporary implementation using an in-memory collection.
/// In production, this should be replaced with a persistent data store.
///
/// Current Implementation:
/// - Uses List&lt;User&gt; for storage
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
/// Note: Seeds with 3 sample users on initialization for demo purposes.
/// </remarks>
public class UserRepository : IUserRepository
{
	/// <summary>
	/// In-memory storage for user entities.
	/// </summary>
	/// <remarks>
	/// WARNING: This is not thread-safe. For concurrent access, wrap operations in locks
	/// or use ConcurrentBag/ConcurrentDictionary.
	/// </remarks>
	private readonly List<User> Users = [];

	/// <summary>
	/// Counter for generating unique IDs.
	/// </summary>
	/// <remarks>
	/// In production with real DB, this would be handled by auto-increment/identity columns.
	/// </remarks>
	private int NextId = 1;

	/// <summary>
	/// Initializes a new instance of the <see cref="UserRepository"/> class.
	/// </summary>
	/// <remarks>
	/// Constructor seeds the repository with 3 sample user records for demonstration.
	/// In production, seeding should be handled by:
	/// - Database migrations
	/// - Separate seed data scripts
	/// - Configuration/startup initialization
	/// </remarks>
	public UserRepository()
	{
		SeedData();
	}

	/// <inheritdoc/>
	/// <remarks>
	/// Returns a copy of the collection to prevent external modification.
	/// In production with EF Core, this would use AsNoTracking() for read-only queries.
	/// </remarks>
	public Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default) => Task.FromResult<IEnumerable<User>>(Users.ToList());

	/// <inheritdoc/>
	/// <remarks>
	/// Returns null if user not found (caller handles this).
	///
	/// Production Note: With proper database, this would be a simple indexed lookup.
	/// </remarks>
	public Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
	{
		User? user = Users.FirstOrDefault(u => u.Id == id);
		return Task.FromResult(user);
	}

	/// <inheritdoc/>
	/// <exception cref="ArgumentNullException">Thrown when entity is null.</exception>
	/// <remarks>
	/// Assigns a new ID and adds to the in-memory list.
	///
	/// Production Implementation with EF Core:
	/// <code>
	/// await _context.Users.AddAsync(entity, cancellationToken);
	/// await _context.SaveChangesAsync(cancellationToken);
	/// return entity;
	/// </code>
	///
	/// Missing Features:
	/// - Duplicate username/email detection
	/// - Validation before persistence
	/// - Audit fields (CreatedDate, CreatedBy)
	/// - Transaction handling
	/// </remarks>
	public Task<User> CreateAsync(User entity, CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(entity);

		entity.Id = NextId++;
		entity.CreatedAt = DateTime.UtcNow;
		Users.Add(entity);
		return Task.FromResult(entity);
	}

	/// <inheritdoc/>
	/// <exception cref="ArgumentNullException">Thrown when entity is null.</exception>
	/// <remarks>
	/// Uses Id to find and update the entity.
	/// Replace-based update: removes old, adds updated.
	///
	/// Production Implementation with EF Core:
	/// <code>
	/// _context.Users.Update(entity);
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
	public Task<User> UpdateAsync(User entity, CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(entity);

		User? existing = Users.FirstOrDefault(u => u.Id == entity.Id);
		if (existing is not null)
		{
			Users.Remove(existing);
			Users.Add(entity);
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
	/// var entity = await _context.Users.FindAsync(id, cancellationToken);
	/// if (entity is null) return false;
	/// _context.Users.Remove(entity);
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
		User? user = Users.FirstOrDefault(u => u.Id == id);
		if (user is null)
		{
			return Task.FromResult(false);
		}

		Users.Remove(user);
		return Task.FromResult(true);
	}

	/// <summary>
	/// Seeds the repository with sample user data.
	/// </summary>
	/// <remarks>
	/// Creates 3 sample users for demonstration purposes.
	///
	/// This is for demonstration purposes only. In production:
	/// - Use database migrations for schema and seed data
	/// - Load seed data from configuration files (JSON, YAML)
	/// - Use environment-specific seeding (dev vs production)
	/// - Consider using libraries like Bogus for test data generation
	///
	/// Seed Data Characteristics:
	/// - Sample usernames and emails
	/// - Mix of active and inactive accounts
	/// - Realistic full names
	/// </remarks>
	private void SeedData()
	{
		Users.Add(new User
		{
			Id = NextId++,
			Username = "john_doe",
			Email = "john.doe@example.com",
			FullName = "John Doe",
			CreatedAt = DateTime.UtcNow.AddDays(-30),
			IsActive = true,
		});

		Users.Add(new User
		{
			Id = NextId++,
			Username = "jane_smith",
			Email = "jane.smith@example.com",
			FullName = "Jane Smith",
			CreatedAt = DateTime.UtcNow.AddDays(-15),
			IsActive = true,
		});

		Users.Add(new User
		{
			Id = NextId++,
			Username = "bob_wilson",
			Email = "bob.wilson@example.com",
			FullName = "Bob Wilson",
			CreatedAt = DateTime.UtcNow.AddDays(-7),
			IsActive = false,
		});
	}
}