// <copyright file="ThirdPartyApiRequestRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Persistence;

namespace SeventySix.ApiTracking;

/// <summary>
/// EF Core implementation for ThirdPartyApiRequest data access.
/// Encapsulates DbContext operations for third-party API request tracking.
/// Internal visibility enforces repository facade pattern.
/// </summary>
/// <param name="context">
/// The <see cref="ApiTrackingDbContext"/> used for database operations.
/// </param>
/// <param name="logger">
/// The <see cref="ILogger{ThirdPartyApiRequestRepository}"/> used for logging diagnostics.
/// </param>
internal class ThirdPartyApiRequestRepository(
	ApiTrackingDbContext context,
	ILogger<ThirdPartyApiRequestRepository> logger)
	:
		BaseRepository<ThirdPartyApiRequest, ApiTrackingDbContext>(
			context,
			logger),
		IThirdPartyApiRequestRepository
{
	/// <inheritdoc/>
	protected override string GetEntityIdentifier(ThirdPartyApiRequest entity)
	{
		return $"{PropertyConstants.Id}={entity.Id}, ApiName={entity.ApiName}, ResetDate={entity.ResetDate}";
	}

	/// <inheritdoc/>
	public async Task<ThirdPartyApiRequest?> GetByApiNameAndDateAsync(
		string apiName,
		DateOnly resetDate,
		CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);

		// Uses composite index on (ApiName, ResetDate) for O(log n) lookup
		ThirdPartyApiRequest? request =
			await GetQueryable()
				.FirstOrDefaultAsync(
					request =>
						request.ApiName == apiName
						&& request.ResetDate == resetDate,
					cancellationToken);

		return request;
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

		// Use QueryBuilder for read-only query with ordering
		QueryBuilder<ThirdPartyApiRequest> queryBuilder =
			new QueryBuilder<ThirdPartyApiRequest>(GetQueryable());
		queryBuilder
			.Where(request => request.ApiName == apiName)
			.OrderByDescending(request => request.ResetDate);

		List<ThirdPartyApiRequest> requests =
			await queryBuilder
				.Build()
				.ToListAsync(cancellationToken);

		return requests;
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<ThirdPartyApiRequest>> GetAllAsync(
		CancellationToken cancellationToken = default)
	{
		// Use QueryBuilder for read-only query with ordering
		QueryBuilder<ThirdPartyApiRequest> queryBuilder =
			new QueryBuilder<ThirdPartyApiRequest>(GetQueryable());
		queryBuilder.OrderBy(request => request.ApiName);

		List<ThirdPartyApiRequest> requests =
			await queryBuilder
				.Build()
				.ToListAsync(cancellationToken);

		return requests;
	}

	/// <inheritdoc/>
	public async Task<int> DeleteOlderThanAsync(
		DateOnly cutoffDate,
		CancellationToken cancellationToken = default)
	{
		// Batch delete operation
		int deletedCount =
			await context
				.ThirdPartyApiRequests
				.Where(request =>
					request.ResetDate < cutoffDate)
				.ExecuteDeleteAsync(cancellationToken);

		return deletedCount;
	}
}