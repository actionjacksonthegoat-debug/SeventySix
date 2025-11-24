// <copyright file="LogRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SeventySix.BusinessLogic.Entities;
using SeventySix.BusinessLogic.Interfaces;
using SeventySix.Data;

namespace SeventySix.Data.Repositories;

/// <summary>
/// Repository implementation for log operations.
/// </summary>
/// <remarks>
/// Implements <see cref="ILogRepository"/> using Entity Framework Core.
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
/// - Indexes on Timestamp, LogLevel, SourceContext
/// - Batch operations for bulk deletes
/// </remarks>
public class LogRepository : ILogRepository
{
	private readonly ApplicationDbContext Context;
	private readonly ILogger<LogRepository> Logger;

	/// <summary>
	/// Initializes a new instance of the <see cref="LogRepository"/> class.
	/// </summary>
	/// <param name="context">The database context.</param>
	/// <param name="logger">The logger instance.</param>
	public LogRepository(
		ApplicationDbContext context,
		ILogger<LogRepository> logger)
	{
		Context = context ?? throw new ArgumentNullException(nameof(context));
		Logger = logger ?? throw new ArgumentNullException(nameof(logger));
	}

	/// <inheritdoc/>
	public async Task<Log> CreateAsync(Log entity, CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(entity);

		try
		{
			Context.Logs.Add(entity);
			await Context.SaveChangesAsync(cancellationToken);

			Logger.LogDebug(
				"Created Log: Id={Id}, LogLevel={LogLevel}",
				entity.Id,
				entity.LogLevel);

			return entity;
		}
		catch (Exception ex)
		{
			// ⚠️ IMPORTANT: Use Console.WriteLine here instead of Logger.LogError
			// to prevent infinite loop if the logging system itself is failing.
			// This is the ONLY place where Console.WriteLine should be used.
			Console.WriteLine($"Error creating log entry: {ex.Message}");
			throw;
		}
	}

	/// <inheritdoc/>
	public async Task<(IEnumerable<Log> Logs, int TotalCount)> GetLogsAsync(
		SeventySix.BusinessLogic.DTOs.Logs.LogFilterRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		try
		{
			IQueryable<Log> query = Context.Logs.AsNoTracking();

			// Apply LogLevel filter
			if (!string.IsNullOrWhiteSpace(request.LogLevel))
			{
				query = query.Where(log => log.LogLevel == request.LogLevel);
			}

			// Apply date range filter (StartDate/EndDate filter by Timestamp)
			if (request.StartDate.HasValue)
			{
				query = query.Where(log => log.Timestamp >= request.StartDate.Value);
			}

			if (request.EndDate.HasValue)
			{
				query = query.Where(log => log.Timestamp <= request.EndDate.Value);
			}

			// Apply search term filter
			if (!string.IsNullOrWhiteSpace(request.SearchTerm))
			{
				// EF Core will automatically parameterize this query - no SQL injection risk
				// Search across all relevant text fields for maximum flexibility
				query = query.Where(log =>
					(log.Message != null && log.Message.Contains(request.SearchTerm)) ||
					(log.ExceptionMessage != null && log.ExceptionMessage.Contains(request.SearchTerm)) ||
					(log.SourceContext != null && log.SourceContext.Contains(request.SearchTerm)) ||
					(log.RequestPath != null && log.RequestPath.Contains(request.SearchTerm)) ||
					(log.StackTrace != null && log.StackTrace.Contains(request.SearchTerm)));
			}

			// Get total count BEFORE pagination
			int totalCount = await query.CountAsync(cancellationToken);

			// Apply sorting (dynamic based on SortBy property)
			// Default: Timestamp descending (most recent first)
			string sortProperty = string.IsNullOrWhiteSpace(request.SortBy) ? "Timestamp" : request.SortBy;
			query = request.SortDescending
				? query.OrderByDescending(e => EF.Property<object>(e, sortProperty))
				: query.OrderBy(e => EF.Property<object>(e, sortProperty));

			// Apply pagination
			int skip = request.GetSkip();
			int take = request.GetValidatedPageSize();

			List<Log> logs = await query
				.Skip(skip)
				.Take(take)
				.ToListAsync(cancellationToken);

			return (logs, totalCount);
		}
		catch (Exception ex)
		{
			Logger.LogError(
				ex,
				"Error retrieving logs with filters: LogLevel={LogLevel}, StartDate={StartDate}, EndDate={EndDate}, Page={Page}",
				request.LogLevel,
				request.StartDate,
				request.EndDate,
				request.Page);
			throw;
		}
	}

	/// <inheritdoc/>
	public async Task<int> DeleteOlderThanAsync(DateTime cutoffDate, CancellationToken cancellationToken = default)
	{
		try
		{
			int deletedCount = await Context.Logs
				.Where(l => l.Timestamp < cutoffDate)
				.ExecuteDeleteAsync(cancellationToken);

			Logger.LogInformation(
				"Deleted {Count} logs older than {CutoffDate}",
				deletedCount,
				cutoffDate);

			return deletedCount;
		}
		catch (Exception ex)
		{
			Logger.LogError(
				ex,
				"Error deleting logs older than {CutoffDate}",
				cutoffDate);
			throw;
		}
	}

	/// <inheritdoc/>
	public async Task<bool> DeleteByIdAsync(int id, CancellationToken cancellationToken = default)
	{
		try
		{
			Logger.LogDebug("Attempting to delete log with ID: {LogId}", id);

			Log? log = await Context.Logs.FindAsync([id], cancellationToken);

			if (log == null)
			{
				Logger.LogWarning("Log with ID {LogId} not found for deletion", id);
				return false;
			}

			Context.Logs.Remove(log);
			await Context.SaveChangesAsync(cancellationToken);

			Logger.LogInformation("Successfully deleted log with ID: {LogId}", id);
			return true;
		}
		catch (Exception ex)
		{
			Logger.LogError(ex, "Error deleting log with ID: {LogId}", id);
			throw;
		}
	}

	/// <inheritdoc/>
	public async Task<int> DeleteBatchAsync(int[] ids, CancellationToken cancellationToken = default)
	{
		try
		{
			Logger.LogDebug("Attempting to delete {Count} logs", ids.Length);

			// Convert to List to avoid ReadOnlySpan implicit conversion issues in .NET 10+ LINQ expressions
			List<int> idList = [.. ids];

			List<Log> logsToDelete = await Context.Logs
				.Where(l => idList.Contains(l.Id))
				.ToListAsync(cancellationToken);

			if (logsToDelete.Count == 0)
			{
				Logger.LogWarning("No logs found matching the provided IDs");
				return 0;
			}

			Context.Logs.RemoveRange(logsToDelete);
			await Context.SaveChangesAsync(cancellationToken);

			Logger.LogWarning(
				"Successfully deleted {DeletedCount} of {RequestedCount} logs",
				logsToDelete.Count,
				ids.Length);

			return logsToDelete.Count;
		}
		catch (Exception ex)
		{
			Logger.LogError(ex, "Error bulk deleting logs. Requested count: {Count}", ids.Length);
			throw;
		}
	}
}