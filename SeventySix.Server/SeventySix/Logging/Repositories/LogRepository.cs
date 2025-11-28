// <copyright file="LogRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SeventySix.Shared.Infrastructure;

namespace SeventySix.Logging;

/// <summary>EF Core implementation for Log data access.</summary>
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
			IQueryable<Log> filteredQuery = ApplyFilters(GetQueryable(), request);

			int totalCount = await filteredQuery.CountAsync(cancellationToken);

			List<Log> logs = await ApplySortingAndPaging(filteredQuery, request)
				.ToListAsync(cancellationToken);

			return (logs, totalCount);
		}
		catch (Exception ex)
		{
			Console.WriteLine($"Error retrieving logs: {ex.Message}");
			throw;
		}
	}

	private static IQueryable<Log> ApplyFilters(IQueryable<Log> query, LogFilterRequest request)
	{
		if (!string.IsNullOrWhiteSpace(request.LogLevel))
		{
			query = query.Where(log => log.LogLevel == request.LogLevel);
		}

		if (request.StartDate.HasValue)
		{
			query = query.Where(log => log.CreateDate >= request.StartDate.Value);
		}

		if (request.EndDate.HasValue)
		{
			query = query.Where(log => log.CreateDate <= request.EndDate.Value);
		}

		if (!string.IsNullOrWhiteSpace(request.SearchTerm))
		{
			query = query.Where(log =>
				(log.Message != null && log.Message.Contains(request.SearchTerm)) ||
				(log.ExceptionMessage != null && log.ExceptionMessage.Contains(request.SearchTerm)) ||
				(log.SourceContext != null && log.SourceContext.Contains(request.SearchTerm)) ||
				(log.RequestPath != null && log.RequestPath.Contains(request.SearchTerm)) ||
				(log.StackTrace != null && log.StackTrace.Contains(request.SearchTerm)));
		}

		return query;
	}

	private static IQueryable<Log> ApplySortingAndPaging(IQueryable<Log> query, LogFilterRequest request)
	{
		string sortProperty = string.IsNullOrWhiteSpace(request.SortBy) ? "CreateDate" : request.SortBy;

		query = request.SortDescending
			? query.OrderByDescending(e => EF.Property<object>(e, sortProperty))
			: query.OrderBy(e => EF.Property<object>(e, sortProperty));

		return query
			.Skip(request.GetSkip())
			.Take(request.GetValidatedPageSize());
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