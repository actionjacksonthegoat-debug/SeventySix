// <copyright file="RecurringJobRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using SeventySix.Shared.BackgroundJobs;

namespace SeventySix.Logging;

/// <summary>
/// EF Core implementation of <see cref="IRecurringJobRepository"/>.
/// Persists job execution tracking in the Logging database.
/// </summary>
/// <param name="dbContext">
/// The Logging database context.
/// </param>
internal class RecurringJobRepository(
	LoggingDbContext dbContext) : IRecurringJobRepository
{
	/// <inheritdoc />
	public async Task<RecurringJobExecution?> GetLastExecutionAsync(
		string jobName,
		CancellationToken cancellationToken = default)
	{
		return await dbContext.RecurringJobExecutions
			.AsNoTracking()
			.FirstOrDefaultAsync(
				execution => execution.JobName == jobName,
				cancellationToken);
	}

	/// <inheritdoc />
	public async Task UpsertExecutionAsync(
		RecurringJobExecution execution,
		CancellationToken cancellationToken = default)
	{
		RecurringJobExecution? existing =
			await dbContext.RecurringJobExecutions
				.FirstOrDefaultAsync(
					record => record.JobName == execution.JobName,
					cancellationToken);

		if (existing is null)
		{
			dbContext.RecurringJobExecutions.Add(execution);
		}
		else
		{
			existing.LastExecutedAt =
				execution.LastExecutedAt;
			existing.NextScheduledAt =
				execution.NextScheduledAt;
			existing.LastExecutedBy =
				execution.LastExecutedBy;
		}

		await dbContext.SaveChangesAsync(cancellationToken);
	}

	/// <inheritdoc />
	public async Task<IReadOnlyList<RecurringJobExecution>> GetAllAsync(
		CancellationToken cancellationToken = default)
	{
		return await dbContext.RecurringJobExecutions
			.AsNoTracking()
			.OrderBy(
				execution => execution.JobName)
			.ToListAsync(cancellationToken);
	}
}