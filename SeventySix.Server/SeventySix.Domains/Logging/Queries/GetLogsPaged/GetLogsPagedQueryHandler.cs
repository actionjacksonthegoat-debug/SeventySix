// <copyright file="GetLogsPagedQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.DTOs;

namespace SeventySix.Logging;

/// <summary>
/// Handler for retrieving paginated log entries.
/// </summary>
public static class GetLogsPagedQueryHandler
{
	/// <summary>
	/// Handles the query to retrieve paginated logs with optional filtering.
	/// </summary>
	/// <param name="query">The query containing filter and pagination parameters.</param>
	/// <param name="repository">The log repository for data access.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>A paged result containing log DTOs.</returns>
	public static async Task<PagedResult<LogDto>> HandleAsync(
		GetLogsPagedQuery query,
		ILogRepository repository,
		CancellationToken cancellationToken)
	{
		(IEnumerable<Log> logs, int totalCount) =
			await repository.GetPagedAsync(query.Request, cancellationToken);

		IEnumerable<LogDto> logDtos = logs.ToDto();

		return new PagedResult<LogDto>
		{
			Items = logDtos.ToList(),
			TotalCount = totalCount,
			Page = query.Request.Page,
			PageSize = query.Request.PageSize,
		};
	}
}