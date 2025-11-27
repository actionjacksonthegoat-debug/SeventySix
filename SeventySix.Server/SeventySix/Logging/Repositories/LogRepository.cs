// <copyright file="LogRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SeventySix.Shared.Infrastructure;

namespace SeventySix.Logging;

/// <summary>
/// Repository implementation for log operations.
/// </summary>
/// <remarks>
/// Implements <see cref="ILogRepository"/> using Entity Framework Core.
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
/// - Indexes on Timestamp, LogLevel, SourceContext
/// - Batch operations for bulk deletes
/// </remarks>
/// <param name="context">The database context.</param>
/// <param name="logger">The logger instance.</param>
internal class LogRepository(
	LoggingDbContext context,
	ILogger<LogRepository> logger) : BaseRepository<Log, LoggingDbContext>(context, logger), ILogRepository
{
	/// <inheritdoc/>
	protected override string GetEntityIdentifier(Log entity)
	{
		return $"Id={entity.Id}, LogLevel={entity.LogLevel}, CreateDate={entity.CreateDate}";
	}

	/// <inheritdoc/>
	/// <remarks>
	/// Special handling: Uses Console.WriteLine instead of logger to prevent infinite logging loops.
	/// </remarks>
	public new async Task<Log> CreateAsync(Log entity, CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(entity);

		// ⚠️ IMPORTANT: For log creation, we cannot use the base logger
		// to prevent infinite loop if the logging system itself is failing.
		try
		{
			context.Logs.Add(entity);
			await context.SaveChangesAsync(cancellationToken);
			return entity;
		}
		catch (Exception ex)
		{
			// Use Console.WriteLine instead of logger to prevent infinite loop
			Console.WriteLine($"Error creating log entry: {ex.Message}");
			throw;
		}
	}

	/// <inheritdoc/>
	public async Task<(IEnumerable<Log> Logs, int TotalCount)> GetPagedAsync(
		LogFilterRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		try
		{
			QueryBuilder<Log> queryBuilder = new QueryBuilder<Log>(GetQueryable());

			// Apply LogLevel filter
			if (!string.IsNullOrWhiteSpace(request.LogLevel))
			{
				queryBuilder.Where(log => log.LogLevel == request.LogLevel);
			}

			// Apply date range filter (StartDate/EndDate filter by Timestamp)
			if (request.StartDate.HasValue)
			{
				queryBuilder.Where(log => log.CreateDate >= request.StartDate.Value);
			}

			if (request.EndDate.HasValue)
			{
				queryBuilder.Where(log => log.CreateDate <= request.EndDate.Value);
			}

			// Apply search term filter
			if (!string.IsNullOrWhiteSpace(request.SearchTerm))
			{
				// EF Core will automatically parameterize this query - no SQL injection risk
				// Search across all relevant text fields for maximum flexibility
				queryBuilder.Where(log =>
					(log.Message != null && log.Message.Contains(request.SearchTerm)) ||
					(log.ExceptionMessage != null && log.ExceptionMessage.Contains(request.SearchTerm)) ||
					(log.SourceContext != null && log.SourceContext.Contains(request.SearchTerm)) ||
					(log.RequestPath != null && log.RequestPath.Contains(request.SearchTerm)) ||
					(log.StackTrace != null && log.StackTrace.Contains(request.SearchTerm)));
			}

			// Get total count BEFORE pagination
			int totalCount = await queryBuilder.Build().CountAsync(cancellationToken);

			// Apply sorting (dynamic based on SortBy property)
			// Default: Timestamp descending (most recent first)
			string sortProperty = string.IsNullOrWhiteSpace(request.SortBy) ? "Timestamp" : request.SortBy;
			if (request.SortDescending)
			{
				queryBuilder.OrderByDescending(e => EF.Property<object>(e, sortProperty));
			}
			else
			{
				queryBuilder.OrderBy(e => EF.Property<object>(e, sortProperty));
			}

			// Apply pagination using QueryBuilder
			queryBuilder.Paginate(request.Page, request.GetValidatedPageSize());

			List<Log> logs = await queryBuilder.Build().ToListAsync(cancellationToken);

			return (logs, totalCount);
		}
		catch (Exception ex)
		{
			// Use Console.WriteLine instead of logger to prevent infinite loop
			Console.WriteLine($"Error retrieving logs with filters: LogLevel={request.LogLevel}, StartDate={request.StartDate}, EndDate={request.EndDate}, Page={request.Page}, Exception={ex.Message}");
			throw;
		}
	}

	/// <inheritdoc/>
	public async Task<int> DeleteOlderThanAsync(DateTime cutoffDate, CancellationToken cancellationToken = default)
	{
		try
		{
			int deletedCount = await context.Logs
				.Where(l => l.CreateDate < cutoffDate)
				.ExecuteDeleteAsync(cancellationToken);

			return deletedCount;
		}
		catch (Exception ex)
		{
			// Use Console.WriteLine instead of logger to prevent infinite loop
			Console.WriteLine($"Error deleting logs older than {cutoffDate}: {ex.Message}");
			throw;
		}
	}

	/// <inheritdoc/>
	public async Task<bool> DeleteByIdAsync(int id, CancellationToken cancellationToken = default)
	{
		ArgumentOutOfRangeException.ThrowIfNegativeOrZero(id);

		try
		{
			Log? log = await context.Logs.FindAsync([id], cancellationToken);

			if (log == null)
			{
				return false;
			}

			context.Logs.Remove(log);
			await context.SaveChangesAsync(cancellationToken);

			return true;
		}
		catch (Exception ex)
		{
			// Use Console.WriteLine instead of logger to prevent infinite loop
			Console.WriteLine($"Error deleting log with ID: {id}, Exception={ex.Message}");
			throw;
		}
	}

	/// <inheritdoc/>
	public async Task<int> DeleteBatchAsync(int[] ids, CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(ids);
		ArgumentOutOfRangeException.ThrowIfZero(ids.Length);

		try
		{
			// Convert to List to avoid ReadOnlySpan implicit conversion issues in .NET 10+ LINQ expressions
			List<int> idList = [.. ids];

			List<Log> logsToDelete = await context.Logs
				.Where(l => idList.Contains(l.Id))
				.ToListAsync(cancellationToken);

			if (logsToDelete.Count == 0)
			{
				return 0;
			}

			context.Logs.RemoveRange(logsToDelete);
			await context.SaveChangesAsync(cancellationToken);

			return logsToDelete.Count;
		}
		catch (Exception ex)
		{
			// Use Console.WriteLine instead of logger to prevent infinite loop
			Console.WriteLine($"Error bulk deleting logs. Requested count: {ids.Length}, Exception={ex.Message}");
			throw;
		}
	}
}