// <copyright file="UserRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SeventySix.Shared;
using SeventySix.Shared.Infrastructure;

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
/// - Template Method: Inherits error handling from BaseRepository
/// - Builder: Uses QueryBuilder for complex queries
/// - Unit of Work: DbContext manages transactions
///
/// SOLID Principles:
/// - SRP: Only responsible for data access operations
/// - DIP: Implements interface defined in Core layer
/// - OCP: Can be extended without modification
///
/// Performance Optimizations:
/// - AsNoTracking for read-only queries
/// - Indexes on Username, Email, IsDeleted, IsActive, CreateDate
/// - Global query filter for soft delete (excludes IsDeleted = true by default)
/// - Optimistic concurrency control using PostgreSQL xmin (uint RowVersion)
/// </remarks>
/// <param name="context">The database context.</param>
/// <param name="repositoryLogger">The logger instance.</param>
internal class UserRepository(
	IdentityDbContext context,
	ILogger<UserRepository> repositoryLogger) : BaseRepository<User, IdentityDbContext>(context, repositoryLogger), IUserRepository
{
	/// <inheritdoc/>
	protected override string GetEntityIdentifier(User entity)
	{
		return $"Id={entity.Id}, Username={entity.Username}";
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default)
	{
		return await GetQueryable()
			.OrderBy(u => u.Username)
			.ToListAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
	{
		ArgumentOutOfRangeException.ThrowIfNegativeOrZero(id);

		return await GetQueryable()
			.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
	}

	/// <inheritdoc/>
	public new async Task<User> CreateAsync(User entity, CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(entity);
		return await base.CreateAsync(entity, cancellationToken);
	}

	/// <inheritdoc/>
	/// <remarks>
	/// Uses base UpdateAsync implementation for consistent tracking logic.
	/// </remarks>
	public new async Task<User> UpdateAsync(User entity, CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(entity);
		return await base.UpdateAsync(entity, cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
	{
		ArgumentOutOfRangeException.ThrowIfNegativeOrZero(id);

		return await ExecuteWithErrorHandlingAsync(
			async () =>
			{
				User? entity = await context.Users.FindAsync([id], cancellationToken);
				if (entity is null)
				{
					return false;
				}

				context.Users.Remove(entity);
				await context.SaveChangesAsync(cancellationToken);
				return true;
			},
			nameof(DeleteAsync),
			$"Id={id}");
	}

	/// <inheritdoc/>
	public async Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(username);

		return await GetQueryable()
			.FirstOrDefaultAsync(u => u.Username == username, cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(email);

		return await GetQueryable()
			.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower(), cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> UsernameExistsAsync(string username, int? excludeId = null, CancellationToken cancellationToken = default)
	{
		if (excludeId.HasValue)
		{
			return await context.Users.AnyAsync(u => u.Username == username && u.Id != excludeId.Value, cancellationToken);
		}

		return await context.Users.AnyAsync(u => u.Username == username, cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> EmailExistsAsync(string email, int? excludeId = null, CancellationToken cancellationToken = default)
	{
		string lowerEmail = email.ToLower();

		if (excludeId.HasValue)
		{
			return await context.Users.AnyAsync(u => u.Email.ToLower() == lowerEmail && u.Id != excludeId.Value, cancellationToken);
		}

		return await context.Users.AnyAsync(u => u.Email.ToLower() == lowerEmail, cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<(IEnumerable<User> Users, int TotalCount)> GetPagedAsync(
		UserQueryRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		IQueryable<User> baseQuery = request.IncludeDeleted
			? context.Users.IgnoreQueryFilters()
			: GetQueryable();

		IQueryable<User> query = baseQuery.ApplyQueryBuilder(builder =>
		{
			// Apply search filter
			if (!string.IsNullOrWhiteSpace(request.SearchTerm))
			{
				builder = builder.Where(u =>
					u.Username.Contains(request.SearchTerm) ||
					u.Email.Contains(request.SearchTerm) ||
					(u.FullName != null && u.FullName.Contains(request.SearchTerm)));
			}

			// Apply active status filter
			if (request.IsActive.HasValue)
			{
				builder = builder.Where(u => u.IsActive == request.IsActive.Value);
			}

			// Apply date range filter
			if (request.StartDate.HasValue)
			{
				builder = builder.Where(u => u.LastLoginAt >= request.StartDate.Value);
			}

			if (request.EndDate.HasValue)
			{
				builder = builder.Where(u => u.LastLoginAt <= request.EndDate.Value);
			}

			// Apply sorting
			string sortProperty = string.IsNullOrWhiteSpace(request.SortBy) ? "Id" : request.SortBy;
			builder = request.SortDescending
				? builder.OrderByDescending(u => EF.Property<object>(u, sortProperty))
				: builder.OrderBy(u => EF.Property<object>(u, sortProperty));

			// Apply pagination
			return builder
				.Skip(request.GetSkip())
				.Take(request.GetValidatedPageSize());
		});

		// Get total count and data
		int totalCount = await baseQuery
			.ApplyQueryBuilder(builder =>
			{
				if (!string.IsNullOrWhiteSpace(request.SearchTerm))
				{
					builder = builder.Where(u =>
						u.Username.Contains(request.SearchTerm) ||
						u.Email.Contains(request.SearchTerm) ||
						(u.FullName != null && u.FullName.Contains(request.SearchTerm)));
				}

				if (request.IsActive.HasValue)
				{
					builder = builder.Where(u => u.IsActive == request.IsActive.Value);
				}

				if (request.StartDate.HasValue)
				{
					builder = builder.Where(u => u.LastLoginAt >= request.StartDate.Value);
				}

				if (request.EndDate.HasValue)
				{
					builder = builder.Where(u => u.LastLoginAt <= request.EndDate.Value);
				}

				return builder;
			})
			.CountAsync(cancellationToken);

		List<User> users = await query
			.ToListAsync(cancellationToken);

		return (users, totalCount);
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<User>> GetByIdsAsync(IEnumerable<int> ids, CancellationToken cancellationToken = default)
	{
		return await GetQueryable()
			.Where(u => ids.Contains(u.Id))
			.ToListAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<int> BulkUpdateActiveStatusAsync(IEnumerable<int> ids, bool isActive, CancellationToken cancellationToken = default)
	{
		BulkOperationExecutor<User> executor = new(context);
		return await executor.ExecuteBulkUpdateAsync(
			ids,
			user => user.IsActive = isActive,
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> SoftDeleteAsync(int id, string deletedBy, CancellationToken cancellationToken = default)
	{
		return await ExecuteWithErrorHandlingAsync(
			async () =>
			{
				User? user = await context.Users
					.IgnoreQueryFilters()
					.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted, cancellationToken);

				if (user is null)
				{
					return false;
				}

				user.IsDeleted = true;
				user.DeletedAt = DateTime.UtcNow;
				user.DeletedBy = deletedBy;

				await context.SaveChangesAsync(cancellationToken);
				return true;
			},
			nameof(SoftDeleteAsync),
			$"Id={id}");
	}

	/// <inheritdoc/>
	public async Task<bool> RestoreAsync(int id, CancellationToken cancellationToken = default)
	{
		return await ExecuteWithErrorHandlingAsync(
			async () =>
			{
				User? user = await context.Users
					.IgnoreQueryFilters()
					.FirstOrDefaultAsync(u => u.Id == id && u.IsDeleted, cancellationToken);

				if (user is null)
				{
					return false;
				}

				user.IsDeleted = false;
				user.DeletedAt = null;
				user.DeletedBy = null;

				await context.SaveChangesAsync(cancellationToken);
				return true;
			},
			nameof(RestoreAsync),
			$"Id={id}");
	}

	/// <inheritdoc/>
	public async Task<int> CountAsync(bool? isActive = null, bool includeDeleted = false, CancellationToken cancellationToken = default)
	{
		IQueryable<User> query = context.Users.AsQueryable();

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

