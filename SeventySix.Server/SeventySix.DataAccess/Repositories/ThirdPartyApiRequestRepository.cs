// <copyright file="ThirdPartyApiRequestRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SeventySix.Core.Entities;
using SeventySix.Core.Interfaces;
using SeventySix.Data;

namespace SeventySix.DataAccess.Repositories;

/// <summary>
/// Repository implementation for third-party API request tracking operations.
/// </summary>
/// <remarks>
/// Implements <see cref="IThirdPartyApiRequestRepository"/> using Entity Framework Core.
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
/// - Composite index on (ApiName, ResetDate)
/// - Batch operations for bulk deletes
/// </remarks>
public class ThirdPartyApiRequestRepository : IThirdPartyApiRequestRepository
{
	private readonly ApplicationDbContext _context;
	private readonly ILogger<ThirdPartyApiRequestRepository> _logger;

	/// <summary>
	/// Initializes a new instance of the <see cref="ThirdPartyApiRequestRepository"/> class.
	/// </summary>
	/// <param name="context">The database context.</param>
	/// <param name="logger">The logger instance.</param>
	public ThirdPartyApiRequestRepository(
		ApplicationDbContext context,
		ILogger<ThirdPartyApiRequestRepository> logger)
	{
		_context = context ?? throw new ArgumentNullException(nameof(context));
		_logger = logger ?? throw new ArgumentNullException(nameof(logger));
	}

	/// <inheritdoc/>
	public async Task<ThirdPartyApiRequest?> GetByApiNameAndDateAsync(
		string apiName,
		DateOnly resetDate,
		CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);

		try
		{
			// Check if we're inside a transaction
			// If so, use tracking to ensure we see the latest data and can update it
			// If not, use AsNoTracking for better performance on read-only queries
			var hasActiveTransaction = _context.Database.CurrentTransaction != null;

			var query = _context.ThirdPartyApiRequests.AsQueryable();

			if (!hasActiveTransaction)
			{
				query = query.AsNoTracking();
			}

			// Uses composite index on (ApiName, ResetDate) for O(log n) lookup
			var request = await query
				.FirstOrDefaultAsync(
					r => r.ApiName == apiName && r.ResetDate == resetDate,
					cancellationToken);

			_logger.LogDebug(
				"Retrieved ThirdPartyApiRequest for {ApiName} on {ResetDate}: {Found} (Tracking: {Tracking})",
				apiName,
				resetDate,
				request != null,
				hasActiveTransaction);

			return request;
		}
		catch (Exception ex)
		{
			_logger.LogError(
				ex,
				"Error retrieving ThirdPartyApiRequest for {ApiName} on {ResetDate}",
				apiName,
				resetDate);
			throw;
		}
	}

	/// <inheritdoc/>
	public async Task<ThirdPartyApiRequest> CreateAsync(
		ThirdPartyApiRequest entity,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(entity);

		try
		{
			_context.ThirdPartyApiRequests.Add(entity);
			await _context.SaveChangesAsync(cancellationToken);

			_logger.LogInformation(
				"Created ThirdPartyApiRequest: Id={Id}, ApiName={ApiName}, ResetDate={ResetDate}",
				entity.Id,
				entity.ApiName,
				entity.ResetDate);

			return entity;
		}
		catch (DbUpdateException ex)
		{
			_logger.LogError(
				ex,
				"Error creating ThirdPartyApiRequest for {ApiName}. Possible constraint violation.",
				entity.ApiName);
			throw;
		}
		catch (Exception ex)
		{
			_logger.LogError(
				ex,
				"Unexpected error creating ThirdPartyApiRequest for {ApiName}",
				entity.ApiName);
			throw;
		}
	}

	/// <inheritdoc/>
	public async Task<ThirdPartyApiRequest> UpdateAsync(
		ThirdPartyApiRequest entity,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(entity);

		try
		{
			// Check if entity is already tracked
			var trackedEntity = _context.ThirdPartyApiRequests.Local
				.FirstOrDefault(e => e.Id == entity.Id);

			if (trackedEntity != null)
			{
				// Entity is already tracked, update its properties
				_context.Entry(trackedEntity).CurrentValues.SetValues(entity);
			}
			else
			{
				// Entity is not tracked, attach and mark as modified
				_context.ThirdPartyApiRequests.Update(entity);
			}

			await _context.SaveChangesAsync(cancellationToken);

			_logger.LogDebug(
				"Updated ThirdPartyApiRequest: Id={Id}, CallCount={CallCount}",
				entity.Id,
				entity.CallCount);

			return entity;
		}
		catch (DbUpdateConcurrencyException ex)
		{
			_logger.LogError(
				ex,
				"Concurrency error updating ThirdPartyApiRequest: Id={Id}",
				entity.Id);
			throw;
		}
		catch (Exception ex)
		{
			_logger.LogError(
				ex,
				"Error updating ThirdPartyApiRequest: Id={Id}",
				entity.Id);
			throw;
		}
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<ThirdPartyApiRequest>> GetByApiNameAsync(
		string apiName,
		CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);

		try
		{
			// Use AsNoTracking for read-only query
			// Order by ResetDate descending (most recent first)
			var requests = await _context.ThirdPartyApiRequests
				.AsNoTracking()
				.Where(r => r.ApiName == apiName)
				.OrderByDescending(r => r.ResetDate)
				.ToListAsync(cancellationToken);

			_logger.LogDebug(
				"Retrieved {Count} ThirdPartyApiRequest records for {ApiName}",
				requests.Count,
				apiName);

			return requests;
		}
		catch (Exception ex)
		{
			_logger.LogError(
				ex,
				"Error retrieving ThirdPartyApiRequest records for {ApiName}",
				apiName);
			throw;
		}
	}

	/// <inheritdoc/>
	public async Task<int> DeleteOlderThanAsync(
		DateOnly cutoffDate,
		CancellationToken cancellationToken = default)
	{
		try
		{
			// Batch delete operation
			var deletedCount = await _context.ThirdPartyApiRequests
				.Where(r => r.ResetDate < cutoffDate)
				.ExecuteDeleteAsync(cancellationToken);

			_logger.LogInformation(
				"Deleted {Count} ThirdPartyApiRequest records older than {CutoffDate}",
				deletedCount,
				cutoffDate);

			return deletedCount;
		}
		catch (Exception ex)
		{
			_logger.LogError(
				ex,
				"Error deleting ThirdPartyApiRequest records older than {CutoffDate}",
				cutoffDate);
			throw;
		}
	}
}