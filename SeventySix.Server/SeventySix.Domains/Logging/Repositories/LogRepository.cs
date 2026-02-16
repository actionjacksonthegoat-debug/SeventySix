// <copyright file="LogRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Persistence;

namespace SeventySix.Logging;

/// <summary>
/// Repository for log data access.
/// </summary>
/// <param name="context">
///  The logging database context.
/// </param>
/// <param name="logger">
///  The logger instance.
/// </param>
internal class LogRepository(
	LoggingDbContext context,
	ILogger<LogRepository> logger) : BaseRepository<Log, LoggingDbContext>(context, logger), ILogRepository
{
	/// <inheritdoc/>
	protected override string GetEntityIdentifier(Log entity)
	{
		return $"{PropertyConstants.Id}={entity.Id}, LogLevel={entity.LogLevel}, CreateDate={entity.CreateDate}";
	}

	/// <inheritdoc/>
	/// <remarks>
	/// Special handling: Uses Console.WriteLine instead of logger to prevent infinite logging loops.
	/// </remarks>
	public new async Task<Log> CreateAsync(
		Log entity,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(entity);

		context.Logs.Add(entity);
		await context.SaveChangesAsync(cancellationToken);
		return entity;
	}

	/// <inheritdoc/>
	/// <remarks>
	/// Batch insert: Uses AddRange for efficient single-roundtrip database operation.
	/// </remarks>
	public async Task CreateBatchAsync(
		IEnumerable<Log> entities,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(entities);

		context.Logs.AddRange(entities);
		await context.SaveChangesAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<(IEnumerable<Log> Logs, int TotalCount)> GetPagedAsync(
		LogQueryRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		IQueryable<Log> filteredQuery =
			ApplyFilters(
				GetQueryable(),
				request);

		int totalCount =
			await filteredQuery.CountAsync(cancellationToken);

		List<Log> logs =
			await ApplySortingAndPaging(filteredQuery, request)
				.ToListAsync(cancellationToken);

		return (logs, totalCount);
	}

	/// <summary>
	/// Applies filtering criteria from <see cref="LogQueryRequest"/> to the query.
	/// </summary>
	/// <param name="query">
	/// The base query for <see cref="Log"/> entities.
	/// </param>
	/// <param name="request">
	/// The filter and pagination request.
	/// </param>
	/// <returns>
	/// A filtered <see cref="IQueryable{Log}"/>.
	/// </returns>
	private static IQueryable<Log> ApplyFilters(
		IQueryable<Log> query,
		LogQueryRequest request)
	{
		if (!string.IsNullOrWhiteSpace(request.LogLevel))
		{
			query =
				query.Where(log => log.LogLevel == request.LogLevel);
		}

		if (request.StartDate.HasValue)
		{
			query =
				query.Where(log =>
					log.CreateDate >= request.StartDate.Value);
		}

		if (request.EndDate.HasValue)
		{
			query =
				query.Where(log => log.CreateDate <= request.EndDate.Value);
		}

		if (!string.IsNullOrWhiteSpace(request.SearchTerm))
		{
			query =
				query.Where(log =>
					(
						log.Message != null
						&& log.Message.Contains(request.SearchTerm))
					|| (
						log.ExceptionMessage != null
						&& log.ExceptionMessage.Contains(request.SearchTerm))
					|| (
						log.SourceContext != null
						&& log.SourceContext.Contains(request.SearchTerm))
					|| (
						log.RequestPath != null
						&& log.RequestPath.Contains(request.SearchTerm))
					|| (
						log.StackTrace != null
						&& log.StackTrace.Contains(request.SearchTerm)));
		}

		return query;
	}

	/// <summary>
	/// Applies sorting and paging to the query based on request parameters.
	/// </summary>
	/// <param name="query">
	/// The query to sort and page.
	/// </param>
	/// <param name="request">
	/// The request containing sorting and paging options.
	/// </param>
	/// <returns>
	/// A sorted and paged <see cref="IQueryable{Log}"/>.
	/// </returns>
	private static IQueryable<Log> ApplySortingAndPaging(
		IQueryable<Log> query,
		LogQueryRequest request)
	{
		string sortProperty =
			string.IsNullOrWhiteSpace(request.SortBy)
			? nameof(Log.CreateDate)
			: request.SortBy;

		query =
			request.SortDescending
			? query.OrderByDescending(logEntry =>
				EF.Property<object>(logEntry, sortProperty))
			: query.OrderBy(logEntry =>
				EF.Property<object>(logEntry, sortProperty));

		return query
			.Skip(request.GetSkip())
			.Take(request.GetValidatedPageSize());
	}

	/// <inheritdoc/>
	public async Task<int> DeleteOlderThanAsync(
		DateTimeOffset cutoffDate,
		CancellationToken cancellationToken = default)
	{
		int deletedCount =
			await context
				.Logs
				.Where(logEntry => logEntry.CreateDate < cutoffDate)
				.ExecuteDeleteAsync(cancellationToken);

		return deletedCount;
	}

	/// <inheritdoc/>
	public async Task<bool> DeleteByIdAsync(
		long id,
		CancellationToken cancellationToken = default)
	{
		ArgumentOutOfRangeException.ThrowIfNegativeOrZero(id);

		Log? log =
			await context.Logs.FindAsync(
				[id],
				cancellationToken);

		if (log == null)
		{
			return false;
		}

		context.Logs.Remove(log);
		await context.SaveChangesAsync(cancellationToken);

		return true;
	}

	/// <inheritdoc/>
	public async Task<int> DeleteBatchAsync(
		long[] ids,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(ids);
		ArgumentOutOfRangeException.ThrowIfZero(ids.Length);

		List<long> idList =
			[.. ids];

		int deletedCount =
			await context
				.Logs
				.Where(logEntry => idList.Contains(logEntry.Id))
				.ExecuteDeleteAsync(cancellationToken);

		return deletedCount;
	}
}