// <copyright file="RecurringJobExecutionConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SeventySix.Shared.BackgroundJobs;

namespace SeventySix.Logging;

/// <summary>
/// EF Core configuration for <see cref="RecurringJobExecution"/>.
/// </summary>
public class RecurringJobExecutionConfiguration
	: IEntityTypeConfiguration<RecurringJobExecution>
{
	/// <inheritdoc />
	public void Configure(EntityTypeBuilder<RecurringJobExecution> builder)
	{
		builder
			.ToTable("recurring_job_executions");

		builder
			.HasKey(
				execution => execution.JobName);

		builder
			.Property(
				execution => execution.JobName)
			.HasMaxLength(128)
			.IsRequired();

		builder
			.Property(
				execution => execution.LastExecutedAt)
			.IsRequired();

		builder
			.Property(
				execution => execution.NextScheduledAt);

		builder
			.Property(
				execution => execution.LastExecutedBy)
			.HasMaxLength(256);
	}
}
