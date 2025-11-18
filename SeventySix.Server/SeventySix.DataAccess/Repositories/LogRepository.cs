// <copyright file="LogRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SeventySix.Application.Entities;
using SeventySix.Application.Interfaces;
using SeventySix.Data;

namespace SeventySix.DataAccess.Repositories;

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
	public async Task<IEnumerable<Log>> GetLogsAsync(
		string? logLevel = null,
		DateTime? startDate = null,
		DateTime? endDate = null,
		string? sourceContext = null,
		string? requestPath = null,
		int skip = 0,
		int take = 100,
		CancellationToken cancellationToken = default)
	{
		try
		{
			IQueryable<Log> query = Context.Logs.AsNoTracking();

			if (!string.IsNullOrWhiteSpace(logLevel))
			{
				query = query.Where(l => l.LogLevel == logLevel);
			}

			if (startDate.HasValue)
			{
				query = query.Where(l => l.Timestamp >= startDate.Value);
			}

			if (endDate.HasValue)
			{
				query = query.Where(l => l.Timestamp <= endDate.Value);
			}

			if (!string.IsNullOrWhiteSpace(sourceContext))
			{
				query = query.Where(l => l.SourceContext != null && l.SourceContext.Contains(sourceContext));
			}

			if (!string.IsNullOrWhiteSpace(requestPath))
			{
				query = query.Where(l => l.RequestPath != null && l.RequestPath.Contains(requestPath));
			}

			return await query
				.OrderByDescending(l => l.Timestamp)
				.Skip(skip)
				.Take(Math.Min(take, 1000)) // Max 1000 records
				.ToListAsync(cancellationToken);
		}
		catch (Exception ex)
		{
			Logger.LogError(
				ex,
				"Error retrieving logs with filters: LogLevel={LogLevel}, StartDate={StartDate}, EndDate={EndDate}",
				logLevel,
				startDate,
				endDate);
			throw;
		}
	}

	/// <inheritdoc/>
	public async Task<int> GetLogsCountAsync(
		string? logLevel = null,
		DateTime? startDate = null,
		DateTime? endDate = null,
		string? sourceContext = null,
		string? requestPath = null,
		CancellationToken cancellationToken = default)
	{
		try
		{
			IQueryable<Log> query = Context.Logs.AsNoTracking();

			if (!string.IsNullOrWhiteSpace(logLevel))
			{
				query = query.Where(l => l.LogLevel == logLevel);
			}

			if (startDate.HasValue)
			{
				query = query.Where(l => l.Timestamp >= startDate.Value);
			}

			if (endDate.HasValue)
			{
				query = query.Where(l => l.Timestamp <= endDate.Value);
			}

			if (!string.IsNullOrWhiteSpace(sourceContext))
			{
				query = query.Where(l => l.SourceContext != null && l.SourceContext.Contains(sourceContext));
			}

			if (!string.IsNullOrWhiteSpace(requestPath))
			{
				query = query.Where(l => l.RequestPath != null && l.RequestPath.Contains(requestPath));
			}

			return await query.CountAsync(cancellationToken);
		}
		catch (Exception ex)
		{
			Logger.LogError(
				ex,
				"Error counting logs with filters: LogLevel={LogLevel}, StartDate={StartDate}, EndDate={EndDate}",
				logLevel,
				startDate,
				endDate);
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
	public async Task<LogStatistics> GetStatisticsAsync(
		DateTime startDate,
		DateTime endDate,
		CancellationToken cancellationToken = default)
	{
		try
		{
			List<Log> logs = await Context.Logs
				.AsNoTracking()
				.Where(l => l.Timestamp >= startDate && l.Timestamp <= endDate)
				.ToListAsync(cancellationToken);

			LogStatistics stats = new()
			{
				TotalLogs = logs.Count,
				ErrorCount = logs.Count(l => l.LogLevel == "Error"),
				WarningCount = logs.Count(l => l.LogLevel == "Warning"),
				FatalCount = logs.Count(l => l.LogLevel == "Fatal"),
				TotalRequests = logs.Count(l => l.RequestPath != null),
				FailedRequests = logs.Count(l => l.StatusCode >= 400),
				AverageResponseTimeMs = logs.Where(l => l.DurationMs.HasValue).Average(l => (double?)l.DurationMs) ?? 0,
			};

			stats.TopErrorSources = logs
				.Where(l => l.LogLevel == "Error" && l.SourceContext != null)
				.GroupBy(l => l.SourceContext!)
				.OrderByDescending(g => g.Count())
				.Take(10)
				.ToDictionary(g => g.Key, g => g.Count());

			stats.RequestsByPath = logs
				.Where(l => l.RequestPath != null)
				.GroupBy(l => l.RequestPath!)
				.OrderByDescending(g => g.Count())
				.Take(10)
				.ToDictionary(g => g.Key, g => g.Count());

			Logger.LogDebug(
				"Generated statistics: TotalLogs={TotalLogs}, ErrorCount={ErrorCount}, StartDate={StartDate}, EndDate={EndDate}",
				stats.TotalLogs,
				stats.ErrorCount,
				startDate,
				endDate);

			return stats;
		}
		catch (Exception ex)
		{
			Logger.LogError(
				ex,
				"Error generating statistics for date range: StartDate={StartDate}, EndDate={EndDate}",
				startDate,
				endDate);
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