// <copyright file="MarkEmailFailedCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;
using SeventySix.ElectronicNotifications;
using SeventySix.ElectronicNotifications.Emails;
using Shouldly;

namespace SeventySix.Domains.Tests.ElectronicNotifications.Emails.Commands;

/// <summary>
/// Unit tests for <see cref="MarkEmailFailedCommandHandler"/>.
/// </summary>
/// <remarks>
/// Coverage Focus:
/// - Attempt increment
/// - Status transition to Failed
/// - Status transition to DeadLetter when max attempts reached
/// - Error message storage.
/// </remarks>
public class MarkEmailFailedCommandHandlerTests
{
	private readonly FakeTimeProvider TimeProvider;

	public MarkEmailFailedCommandHandlerTests()
	{
		TimeProvider =
			new FakeTimeProvider();
		TimeProvider.SetUtcNow(
			new DateTimeOffset(2026, 1, 1, 00, 00, 0, TimeSpan.Zero));
	}

	private static ElectronicNotificationsDbContext CreateInMemoryDbContext()
	{
		DbContextOptions<ElectronicNotificationsDbContext> options =
			new DbContextOptionsBuilder<ElectronicNotificationsDbContext>()
				.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
				.Options;

		return new ElectronicNotificationsDbContext(options);
	}

	[Fact]
	public async Task HandleAsync_IncrementsAttempts_AndSetsFailedStatusAsync()
	{
		// Arrange
		await using ElectronicNotificationsDbContext dbContext =
			CreateInMemoryDbContext();

		DateTime createDate =
			TimeProvider.GetUtcNow().UtcDateTime;

		EmailQueueEntry entry =
			new()
			{
				EmailType = EmailType.Welcome,
				RecipientEmail = "test@example.com",
				TemplateData = "{}",
				Status =
					EmailQueueStatus.Processing,
				Attempts = 0,
				MaxAttempts = 3,
				CreateDate = createDate,
				IdempotencyKey = Guid.NewGuid()
			};

		dbContext.EmailQueue.Add(entry);
		await dbContext.SaveChangesAsync();

		MarkEmailFailedCommand command =
			new(
				entry.Id,
				"SMTP connection failed");

		// Act
		bool result =
			await MarkEmailFailedCommandHandler.HandleAsync(
				command,
				dbContext,
				TimeProvider,
				CancellationToken.None);

		// Assert
		result.ShouldBeTrue();

		EmailQueueEntry? updatedEntry =
			await dbContext.EmailQueue.FindAsync(
				entry.Id);
		updatedEntry.ShouldNotBeNull();
		updatedEntry.Attempts.ShouldBe(1);
		updatedEntry.Status.ShouldBe(EmailQueueStatus.Failed);
		updatedEntry.ErrorMessage.ShouldBe("SMTP connection failed");
		updatedEntry.LastAttemptAt.ShouldNotBeNull();
	}

	[Fact]
	public async Task HandleAsync_SetsDeadLetterStatus_WhenMaxAttemptsReachedAsync()
	{
		// Arrange
		await using ElectronicNotificationsDbContext dbContext =
			CreateInMemoryDbContext();

		DateTime createDate =
			TimeProvider.GetUtcNow().UtcDateTime;

		EmailQueueEntry entry =
			new()
			{
				EmailType = EmailType.PasswordReset,
				RecipientEmail = "test@example.com",
				TemplateData = "{}",
				Status =
					EmailQueueStatus.Processing,
				Attempts = 2,
				MaxAttempts = 3,
				CreateDate = createDate,
				IdempotencyKey = Guid.NewGuid()
			};

		dbContext.EmailQueue.Add(entry);
		await dbContext.SaveChangesAsync();

		MarkEmailFailedCommand command =
			new(entry.Id, "Final failure");

		// Act
		bool result =
			await MarkEmailFailedCommandHandler.HandleAsync(
				command,
				dbContext,
				TimeProvider,
				CancellationToken.None);

		// Assert
		result.ShouldBeTrue();

		EmailQueueEntry? updatedEntry =
			await dbContext.EmailQueue.FindAsync(
				entry.Id);
		updatedEntry.ShouldNotBeNull();
		updatedEntry.Attempts.ShouldBe(3);
		updatedEntry.Status.ShouldBe(EmailQueueStatus.DeadLetter);
	}

	[Fact]
	public async Task HandleAsync_TruncatesErrorMessage_WhenTooLongAsync()
	{
		// Arrange
		await using ElectronicNotificationsDbContext dbContext =
			CreateInMemoryDbContext();

		DateTime createDate =
			TimeProvider.GetUtcNow().UtcDateTime;

		EmailQueueEntry entry =
			new()
			{
				EmailType = EmailType.Welcome,
				RecipientEmail = "test@example.com",
				TemplateData = "{}",
				Status =
					EmailQueueStatus.Processing,
				Attempts = 0,
				MaxAttempts = 3,
				CreateDate = createDate,
				IdempotencyKey = Guid.NewGuid()
			};

		dbContext.EmailQueue.Add(entry);
		await dbContext.SaveChangesAsync();

		string longErrorMessage =
			new('x', 2000);

		MarkEmailFailedCommand command =
			new(entry.Id, longErrorMessage);

		// Act
		bool result =
			await MarkEmailFailedCommandHandler.HandleAsync(
				command,
				dbContext,
				TimeProvider,
				CancellationToken.None);

		// Assert
		result.ShouldBeTrue();

		EmailQueueEntry? updatedEntry =
			await dbContext.EmailQueue.FindAsync(
				entry.Id);
		updatedEntry.ShouldNotBeNull();
		updatedEntry.ErrorMessage.ShouldNotBeNull();
		updatedEntry.ErrorMessage.Length.ShouldBeLessThanOrEqualTo(1000);
	}

	[Fact]
	public async Task HandleAsync_ReturnsFalse_WhenEntryNotFoundAsync()
	{
		// Arrange
		await using ElectronicNotificationsDbContext dbContext =
			CreateInMemoryDbContext();

		MarkEmailFailedCommand command =
			new(999, "Error");

		// Act
		bool result =
			await MarkEmailFailedCommandHandler.HandleAsync(
				command,
				dbContext,
				TimeProvider,
				CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}
}