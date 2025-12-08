// <copyright file="ThirdPartyApiRequestRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SeventySix.Shared.Infrastructure;

namespace SeventySix.ApiTracking;

/// <summary>EF Core implementation for ThirdPartyApiRequest data access.</summary>
internal class ThirdPartyApiRequestRepository(
	ApiTrackingDbContext context,
	ILogger<ThirdPartyApiRequestRepository> logger) :
	BaseRepository<ThirdPartyApiRequest, ApiTrackingDbContext>(context, logger), IThirdPartyApiRequestRepository
{
	/// <inheritdoc/>
	protected override string GetEntityIdentifier(ThirdPartyApiRequest entity)
	{
		return $"Id={entity.Id}, ApiName={entity.ApiName}, ResetDate={entity.ResetDate}";
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
			// Uses composite index on (ApiName, ResetDate) for O(log n) lookup
			ThirdPartyApiRequest? request = await GetQueryable()
				.FirstOrDefaultAsync(
				r => r.ApiName == apiName && r.ResetDate == resetDate,
				cancellationToken);

			return request;
		}
		catch (Exception ex)
		{
			base.logger.LogError(
				ex,
				"Error retrieving ThirdPartyApiRequest for {ApiName} on {ResetDate}",
				apiName,
				resetDate);
			throw;
		}
	}

	/// <inheritdoc/>
	public override async Task<ThirdPartyApiRequest> UpdateAsync(
		ThirdPartyApiRequest entity,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(entity);

		// ModifyDate is automatically set by AuditInterceptor
		return await base.UpdateAsync(entity, cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<ThirdPartyApiRequest>> GetByApiNameAsync(
		string apiName,
		CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);

		try
		{
			// Use QueryBuilder for read-only query with ordering
			QueryBuilder<ThirdPartyApiRequest> queryBuilder = new QueryBuilder<ThirdPartyApiRequest>(GetQueryable());
			queryBuilder
				.Where(r => r.ApiName == apiName)
				.OrderByDescending(r => r.ResetDate);

			List<ThirdPartyApiRequest> requests = await queryBuilder.Build().ToListAsync(cancellationToken);

			return requests;
		}
		catch (Exception ex)
		{
			base.logger.LogError(
				ex,
				"Error retrieving ThirdPartyApiRequest records for {ApiName}",
				apiName);
			throw;
		}
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<ThirdPartyApiRequest>> GetAllAsync(
		CancellationToken cancellationToken = default)
	{
		try
		{
			// Use QueryBuilder for read-only query with ordering
			QueryBuilder<ThirdPartyApiRequest> queryBuilder = new QueryBuilder<ThirdPartyApiRequest>(GetQueryable());
			queryBuilder.OrderBy(r => r.ApiName);

			List<ThirdPartyApiRequest> requests = await queryBuilder.Build().ToListAsync(cancellationToken);

			return requests;
		}
		catch (Exception ex)
		{
			base.logger.LogError(
				ex,
				"Error retrieving all ThirdPartyApiRequest records");
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
			int deletedCount = await context.ThirdPartyApiRequests
				.Where(r => r.ResetDate < cutoffDate)
				.ExecuteDeleteAsync(cancellationToken);

			return deletedCount;
		}
		catch (Exception ex)
		{
			base.logger.LogError(
				ex,
				"Error deleting ThirdPartyApiRequest records older than {CutoffDate}",
				cutoffDate);
			throw;
		}
	}
}