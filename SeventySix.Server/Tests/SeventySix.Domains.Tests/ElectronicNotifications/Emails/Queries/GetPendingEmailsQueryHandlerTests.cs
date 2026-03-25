// <copyright file="GetPendingEmailsQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;
using SeventySix.ElectronicNotifications;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Shared.Contracts.Emails;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Domains.Tests.ElectronicNotifications.Emails.Queries;

/// <summary>
/// Integration tests for <see cref="GetPendingEmailsQueryHandler"/>.
/// </summary>
/// <remarks>
/// 80/20 Focus: Tests the critical filtering logic — pending status, failed-with-retry,
/// max-attempts exclusion, and batch size limiting — using a real PostgreSQL database.
/// Real PostgreSQL is required to support the FOR UPDATE SKIP LOCKED raw SQL query
/// and to verify that returned entities are tracked for row-lock integrity.
/// </remarks>
[Collection(CollectionNames.ElectronicNotificationsPostgreSql)]
public sealed class GetPendingEmailsQueryHandlerTests(ElectronicNotificationsPostgreSqlFixture fixture)
	: DataPostgreSqlTestBase(fixture)
{
	private readonly FakeTimeProvider TimeProvider =
		new(new DateTimeOffset(2026, 6, 1, 12, 0, 0, TimeSpan.Zero));

	/// <inheritdoc/>
	public override async Task InitializeAsync()
	{
		await TruncateTablesAsync(TestTables.ElectronicNotifications);
	}

	private ElectronicNotificationsDbContext CreateElectronicNotificationsDbContext() =>
		new(
			new DbContextOptionsBuilder<ElectronicNotificationsDbContext>()
				.UseNpgsql(ConnectionString)
				.Options);

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
			CreateElectronicNotificationsDbContext();

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
			CreateElectronicNotificationsDbContext();

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
			CreateElectronicNotificationsDbContext();

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
			CreateElectronicNotificationsDbContext();

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
			CreateElectronicNotificationsDbContext();

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
			CreateElectronicNotificationsDbContext();

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

	/// <summary>
	/// Verifies that returned email entries are tracked by the DbContext.
	/// Tracked entities are required for FOR UPDATE SKIP LOCKED to hold the row lock
	/// within the surrounding Wolverine transaction, ensuring atomic email claim.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ReturnsPendingEmails_WithTrackedEntitiesAsync()
	{
		// Arrange
		await using ElectronicNotificationsDbContext dbContext =
			CreateElectronicNotificationsDbContext();

		EmailQueueEntry entry =
			CreateEntry(status: EmailQueueStatus.Pending);

		dbContext.EmailQueue.Add(entry);
		await dbContext.SaveChangesAsync();

		// Clear the change tracker so the seeded entity is no longer tracked —
		// we want to verify the handler's query itself returns a tracked entity.
		dbContext.ChangeTracker.Clear();

		GetPendingEmailsQuery query =
			new(BatchSize: 10);

		// Act
		IReadOnlyList<EmailQueueEntry> results =
			await GetPendingEmailsQueryHandler.HandleAsync(
				query,
				dbContext,
				TimeProvider,
				CancellationToken.None);

		// Assert — entities must be tracked (not detached) so FOR UPDATE SKIP LOCKED
		// holds the row lock across the Wolverine transaction boundary.
		results.Count.ShouldBe(1);
		dbContext.Entry(results[0]).State.ShouldNotBe(EntityState.Detached);
	}
}