// <copyright file="UserRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SeventySix.Shared;

namespace SeventySix.Identity;

/// <summary>
/// EF Core implementation of the user repository.
/// Provides data access operations for User entities using PostgreSQL.
/// </summary>
/// <remarks>
/// Implements <see cref="IUserRepository"/> using Entity Framework Core.
///
/// Design Patterns:
/// - Repository: Abstracts data access logic
/// - Unit of Work: DbContext manages transactions
///
/// SOLID Principles:
/// - SRP: Only responsible for data access operations
/// - DIP: Implements interface defined in Core layer
/// - OCP: Can be extended without modification
///
/// Performance Optimizations:
/// - AsNoTracking for read-only queries
/// - Indexes on Username, Email, IsDeleted, IsActive, CreatedAt
/// - Global query filter for soft delete (excludes IsDeleted = true by default)
/// - Optimistic concurrency control using PostgreSQL xmin (uint RowVersion)
/// </remarks>
public class UserRepository : IUserRepository
{
	private readonly IdentityDbContext Context;
	private readonly ILogger<UserRepository> Logger;

	/// <summary>
	/// Initializes a new instance of the <see cref="UserRepository"/> class.
	/// </summary>
	/// <param name="context">The database context.</param>
	/// <param name="logger">The logger instance.</param>
	public UserRepository(
		IdentityDbContext context,
		ILogger<UserRepository> logger)
	{
		Context = context ?? throw new ArgumentNullException(nameof(context));
		Logger = logger ?? throw new ArgumentNullException(nameof(logger));
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default)
	{
		return await Context.Users
			.AsNoTracking()
			.OrderBy(u => u.Username)
			.ToListAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
	{
		return await Context.Users
			.AsNoTracking()
			.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<User> CreateAsync(User entity, CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(entity);

		try
		{
			Context.Users.Add(entity);
			await Context.SaveChangesAsync(cancellationToken);

			Logger.LogInformation(
				"Created User: Id={Id}, Username={Username}",
				entity.Id,
				entity.Username);

			return entity;
		}
		catch (DbUpdateException ex)
		{
			Logger.LogError(
				ex,
				"Error creating User: {Username}. Possible constraint violation.",
				entity.Username);
			throw;
		}
		catch (Exception ex)
		{
			Logger.LogError(
				ex,
				"Unexpected error creating User: {Username}",
				entity.Username);
			throw;
		}
	}

	/// <inheritdoc/>
	public async Task<User> UpdateAsync(User entity, CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(entity);

		try
		{
			// Check if entity is already tracked
			User? trackedEntity = Context.Users.Local
				.FirstOrDefault(e => e.Id == entity.Id);

			if (trackedEntity != null)
			{
				// Entity is already tracked, update its properties
				Context.Entry(trackedEntity).CurrentValues.SetValues(entity);
			}
			else
			{
				// Entity is not tracked, attach and mark as modified
				Context.Users.Update(entity);
			}

			await Context.SaveChangesAsync(cancellationToken);

			Logger.LogDebug(
				"Updated User: Id={Id}, Username={Username}",
				entity.Id,
				entity.Username);

			return entity;
		}
		catch (DbUpdateConcurrencyException ex)
		{
			Logger.LogWarning(
				ex,
				"Concurrency conflict updating User: Id={Id}",
				entity.Id);
			throw;
		}
		catch (DbUpdateException ex)
		{
			Logger.LogError(
				ex,
				"Error updating User: Id={Id}. Possible constraint violation.",
				entity.Id);
			throw;
		}
		catch (Exception ex)
		{
			Logger.LogError(
				ex,
				"Unexpected error updating User: Id={Id}",
				entity.Id);
			throw;
		}
	}

	/// <inheritdoc/>
	public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
	{
		User? entity = await Context.Users.FindAsync([id], cancellationToken);
		if (entity is null)
		{
			return false;
		}

		Context.Users.Remove(entity);
		await Context.SaveChangesAsync(cancellationToken);

		Logger.LogInformation(
			"Deleted User: Id={Id}",
			id);

		return true;
	}

	/// <inheritdoc/>
	public async Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default)
	{
		return await Context.Users
			.AsNoTracking()
			.FirstOrDefaultAsync(u => u.Username == username, cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
	{
		return await Context.Users
			.AsNoTracking()
			.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower(), cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> UsernameExistsAsync(string username, int? excludeId = null, CancellationToken cancellationToken = default)
	{
		if (excludeId.HasValue)
		{
			return await Context.Users.AnyAsync(u => u.Username == username && u.Id != excludeId.Value, cancellationToken);
		}

		return await Context.Users.AnyAsync(u => u.Username == username, cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> EmailExistsAsync(string email, int? excludeId = null, CancellationToken cancellationToken = default)
	{
		string lowerEmail = email.ToLower();

		if (excludeId.HasValue)
		{
			return await Context.Users.AnyAsync(u => u.Email.ToLower() == lowerEmail && u.Id != excludeId.Value, cancellationToken);
		}

		return await Context.Users.AnyAsync(u => u.Email.ToLower() == lowerEmail, cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<(IEnumerable<User> Users, int TotalCount)> GetPagedAsync(
		UserQueryRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		IQueryable<User> query = Context.Users.AsQueryable();

		// Include deleted users if requested
		if (request.IncludeDeleted)
		{
			query = query.IgnoreQueryFilters();
		}

		// Apply search filter
		if (!string.IsNullOrWhiteSpace(request.SearchTerm))
		{
			query = query.Where(u =>
				u.Username.Contains(request.SearchTerm) ||
				u.Email.Contains(request.SearchTerm) ||
				(u.FullName != null && u.FullName.Contains(request.SearchTerm)));
		}

		// Apply active status filter
		if (request.IsActive.HasValue)
		{
			query = query.Where(u => u.IsActive == request.IsActive.Value);
		}

		// Apply date range filter (StartDate/EndDate filter by LastLoginAt)
		if (request.StartDate.HasValue)
		{
			query = query.Where(u => u.LastLoginAt >= request.StartDate.Value);
		}

		if (request.EndDate.HasValue)
		{
			query = query.Where(u => u.LastLoginAt <= request.EndDate.Value);
		}

		// Get total count BEFORE pagination
		int totalCount = await query.CountAsync(cancellationToken);

		// Apply sorting (dynamic based on SortBy property)
		// Default: Id ascending
		string sortProperty = string.IsNullOrWhiteSpace(request.SortBy) ? "Id" : request.SortBy;
		query = request.SortDescending
			? query.OrderByDescending(e => EF.Property<object>(e, sortProperty))
			: query.OrderBy(e => EF.Property<object>(e, sortProperty));

		// Apply pagination
		int skip = request.GetSkip();
		int take = request.GetValidatedPageSize();

		List<User> users = await query
			.AsNoTracking()
			.Skip(skip)
			.Take(take)
			.ToListAsync(cancellationToken);

		return (users, totalCount);
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<User>> GetByIdsAsync(IEnumerable<int> ids, CancellationToken cancellationToken = default)
	{
		return await Context.Users
			.AsNoTracking()
			.Where(u => ids.Contains(u.Id))
			.ToListAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<int> BulkUpdateActiveStatusAsync(IEnumerable<int> ids, bool isActive, CancellationToken cancellationToken = default)
	{
		List<User> users = await Context.Users
			.Where(u => ids.Contains(u.Id))
			.ToListAsync(cancellationToken);

		foreach (User user in users)
		{
			user.IsActive = isActive;
			user.ModifiedAt = DateTime.UtcNow;
		}

		await Context.SaveChangesAsync(cancellationToken);

		Logger.LogInformation(
			"Bulk updated active status for {Count} users to {IsActive}",
			users.Count,
			isActive);

		return users.Count;
	}

	/// <inheritdoc/>
	public async Task<bool> SoftDeleteAsync(int id, string deletedBy, CancellationToken cancellationToken = default)
	{
		// Need to ignore query filters to find the user even if already soft-deleted
		User? user = await Context.Users
			.IgnoreQueryFilters()
			.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted, cancellationToken);

		if (user is null)
		{
			return false;
		}

		user.IsDeleted = true;
		user.DeletedAt = DateTime.UtcNow;
		user.DeletedBy = deletedBy;

		await Context.SaveChangesAsync(cancellationToken);

		Logger.LogInformation(
			"Soft deleted User: Id={Id}, DeletedBy={DeletedBy}",
			id,
			deletedBy);

		return true;
	}

	/// <inheritdoc/>
	public async Task<bool> RestoreAsync(int id, CancellationToken cancellationToken = default)
	{
		// Need to ignore query filters to find soft-deleted users
		User? user = await Context.Users
			.IgnoreQueryFilters()
			.FirstOrDefaultAsync(u => u.Id == id && u.IsDeleted, cancellationToken);

		if (user is null)
		{
			return false;
		}

		user.IsDeleted = false;
		user.DeletedAt = null;
		user.DeletedBy = null;

		await Context.SaveChangesAsync(cancellationToken);

		Logger.LogInformation(
			"Restored User: Id={Id}",
			id);

		return true;
	}

	/// <inheritdoc/>
	public async Task<int> CountAsync(bool? isActive = null, bool includeDeleted = false, CancellationToken cancellationToken = default)
	{
		IQueryable<User> query = Context.Users.AsQueryable();

		// Include deleted users if requested
		if (includeDeleted)
		{
			query = query.IgnoreQueryFilters();
		}

		// Apply active status filter
		if (isActive.HasValue)
		{
			query = query.Where(u => u.IsActive == isActive.Value);
		}

		return await query.CountAsync(cancellationToken);
	}
}
