// <copyright file="GetPendingEmailsQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;
using SeventySix.ElectronicNotifications;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Shared.Contracts.Emails;
using Shouldly;

namespace SeventySix.Domains.Tests.ElectronicNotifications.Emails.Queries;

/// <summary>
/// Unit tests for <see cref="GetPendingEmailsQueryHandler"/>.
/// </summary>
/// <remarks>
/// 80/20 Focus: Tests the critical filtering logic — pending status, failed-with-retry,
/// max-attempts exclusion, and batch size limiting — using an in-memory database.
/// </remarks>
public sealed class GetPendingEmailsQueryHandlerTests
{
	private readonly FakeTimeProvider TimeProvider;

	/// <summary>
	/// Initializes a new instance of the <see cref="GetPendingEmailsQueryHandlerTests"/> class.
	/// </summary>
	public GetPendingEmailsQueryHandlerTests()
	{
		TimeProvider =
			new FakeTimeProvider(
				new DateTimeOffset(2026, 6, 1, 12, 0, 0, TimeSpan.Zero));
	}

	private static ElectronicNotificationsDbContext CreateInMemoryDbContext()
	{
		DbContextOptions<ElectronicNotificationsDbContext> options =
			new DbContextOptionsBuilder<ElectronicNotificationsDbContext>()
				.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
				.Options;

		return new ElectronicNotificationsDbContext(options);
	}

	private EmailQueueEntry CreateEntry(
		string status = "Pending",
		int attempts = 0,
		int maxAttempts = 3,
		DateTimeOffset? lastAttemptAt = null)
	{
		return new EmailQueueEntry
		{
			EmailType = EmailTypeConstants.Welcome,
			RecipientEmail = "test@example.com",
			TemplateData = "{}",
			Status = status,
			Attempts = attempts,
			MaxAttempts = maxAttempts,
			LastAttemptAt = lastAttemptAt,
			CreateDate = TimeProvider.GetUtcNow(),
			IdempotencyKey = Guid.NewGuid(),
		};
	}

	/// <summary>
	/// Verifies that an empty queue returns an empty result.
	/// </summary>
	[Fact]
	public async Task HandleAsync_NoPendingEmails_ReturnsEmptyListAsync()
	{
		// Arrange
		await using ElectronicNotificationsDbContext dbContext =
			CreateInMemoryDbContext();

		GetPendingEmailsQuery query =
			new(BatchSize: 10);

		// Act
		IReadOnlyList<EmailQueueEntry> results =
			await GetPendingEmailsQueryHandler.HandleAsync(
				query,
				dbContext,
				TimeProvider,
				CancellationToken.None);

		// Assert
		results.ShouldBeEmpty();
	}

	/// <summary>
	/// Verifies that pending entries are returned.
	/// </summary>
	[Fact]
	public async Task HandleAsync_HasPendingEntries_ReturnsPendingEmailsAsync()
	{
		// Arrange
		await using ElectronicNotificationsDbContext dbContext =
			CreateInMemoryDbContext();

		EmailQueueEntry entry =
			CreateEntry(status: EmailQueueStatus.Pending);

		dbContext.EmailQueue.Add(entry);
		await dbContext.SaveChangesAsync();

		GetPendingEmailsQuery query =
			new(BatchSize: 10);

		// Act
		IReadOnlyList<EmailQueueEntry> results =
			await GetPendingEmailsQueryHandler.HandleAsync(
				query,
				dbContext,
				TimeProvider,
				CancellationToken.None);

		// Assert
		results.Count.ShouldBe(1);
		results[0].RecipientEmail.ShouldBe("test@example.com");
	}

	/// <summary>
	/// Verifies that a failed entry whose last attempt is older than the retry delay is included.
	/// </summary>
	[Fact]
	public async Task HandleAsync_FailedEntryPastRetryDelay_IncludedInResultsAsync()
	{
		// Arrange
		await using ElectronicNotificationsDbContext dbContext =
			CreateInMemoryDbContext();

		DateTimeOffset lastAttemptAtBeforeThreshold =
			TimeProvider.GetUtcNow().AddMinutes(-10);

		EmailQueueEntry entry =
			CreateEntry(
				status: EmailQueueStatus.Failed,
				attempts: 1,
				lastAttemptAt: lastAttemptAtBeforeThreshold);

		dbContext.EmailQueue.Add(entry);
		await dbContext.SaveChangesAsync();

		GetPendingEmailsQuery query =
			new(BatchSize: 10, RetryDelayMinutes: 5);

		// Act
		IReadOnlyList<EmailQueueEntry> results =
			await GetPendingEmailsQueryHandler.HandleAsync(
				query,
				dbContext,
				TimeProvider,
				CancellationToken.None);

		// Assert
		results.Count.ShouldBe(1);
	}

	/// <summary>
	/// Verifies that a failed entry whose last attempt is within the retry delay is excluded.
	/// </summary>
	[Fact]
	public async Task HandleAsync_FailedEntryWithinRetryDelay_ExcludedFromResultsAsync()
	{
		// Arrange
		await using ElectronicNotificationsDbContext dbContext =
			CreateInMemoryDbContext();

		DateTimeOffset lastAttemptAtAfterThreshold =
			TimeProvider.GetUtcNow().AddMinutes(-1);

		EmailQueueEntry entry =
			CreateEntry(
				status: EmailQueueStatus.Failed,
				attempts: 1,
				lastAttemptAt: lastAttemptAtAfterThreshold);

		dbContext.EmailQueue.Add(entry);
		await dbContext.SaveChangesAsync();

		GetPendingEmailsQuery query =
			new(BatchSize: 10, RetryDelayMinutes: 5);

		// Act
		IReadOnlyList<EmailQueueEntry> results =
			await GetPendingEmailsQueryHandler.HandleAsync(
				query,
				dbContext,
				TimeProvider,
				CancellationToken.None);

		// Assert
		results.ShouldBeEmpty();
	}

	/// <summary>
	/// Verifies that an entry at its maximum attempts is excluded from results.
	/// </summary>
	[Fact]
	public async Task HandleAsync_EntryAtMaxAttempts_ExcludedFromResultsAsync()
	{
		// Arrange
		await using ElectronicNotificationsDbContext dbContext =
			CreateInMemoryDbContext();

		EmailQueueEntry entry =
			CreateEntry(
				status: EmailQueueStatus.Pending,
				attempts: 3,
				maxAttempts: 3);

		dbContext.EmailQueue.Add(entry);
		await dbContext.SaveChangesAsync();

		GetPendingEmailsQuery query =
			new(BatchSize: 10);

		// Act
		IReadOnlyList<EmailQueueEntry> results =
			await GetPendingEmailsQueryHandler.HandleAsync(
				query,
				dbContext,
				TimeProvider,
				CancellationToken.None);

		// Assert
		results.ShouldBeEmpty();
	}

	/// <summary>
	/// Verifies that batch size is respected when more entries exist than the limit.
	/// </summary>
	[Fact]
	public async Task HandleAsync_MoreThanBatchSize_LimitsToRequestedBatchSizeAsync()
	{
		// Arrange
		await using ElectronicNotificationsDbContext dbContext =
			CreateInMemoryDbContext();

		for (int entryIndex = 0; entryIndex < 5; entryIndex++)
		{
			dbContext.EmailQueue.Add(
				CreateEntry(status: EmailQueueStatus.Pending));
		}

		await dbContext.SaveChangesAsync();

		GetPendingEmailsQuery query =
			new(BatchSize: 3);

		// Act
		IReadOnlyList<EmailQueueEntry> results =
			await GetPendingEmailsQueryHandler.HandleAsync(
				query,
				dbContext,
				TimeProvider,
				CancellationToken.None);

		// Assert
		results.Count.ShouldBe(3);
	}
}