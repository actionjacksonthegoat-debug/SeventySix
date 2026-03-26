// <copyright file="MarkEmailFailedCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;
using SeventySix.ElectronicNotifications;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Shared.Contracts.Emails;
using SeventySix.Shared.POCOs;
using SeventySix.TestUtilities.Constants;
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
public sealed class MarkEmailFailedCommandHandlerTests
{
	private readonly FakeTimeProvider TimeProvider;

	public MarkEmailFailedCommandHandlerTests()
	{
		TimeProvider =
			TestDates.CreateFutureTimeProvider();
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

		DateTimeOffset createDate =
			TimeProvider.GetUtcNow();

		EmailQueueEntry entry =
			new()
			{
				EmailType = EmailTypeConstants.Welcome,
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
				"API connection failed");

		// Act
		Result result =
			await MarkEmailFailedCommandHandler.HandleAsync(
				command,
				dbContext,
				TimeProvider,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeTrue();

		EmailQueueEntry? updatedEntry =
			await dbContext.EmailQueue.FindAsync(
				entry.Id);
		updatedEntry.ShouldNotBeNull();
		updatedEntry.Attempts.ShouldBe(1);
		updatedEntry.Status.ShouldBe(EmailQueueStatus.Failed);
		updatedEntry.ErrorMessage.ShouldBe("API connection failed");
		updatedEntry.LastAttemptAt.ShouldNotBeNull();
	}

	[Fact]
	public async Task HandleAsync_SetsDeadLetterStatus_WhenMaxAttemptsReachedAsync()
	{
		// Arrange
		await using ElectronicNotificationsDbContext dbContext =
			CreateInMemoryDbContext();

		DateTimeOffset createDate =
			TimeProvider.GetUtcNow();

		EmailQueueEntry entry =
			new()
			{
				EmailType = EmailTypeConstants.PasswordReset,
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
		Result result =
			await MarkEmailFailedCommandHandler.HandleAsync(
				command,
				dbContext,
				TimeProvider,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeTrue();

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

		DateTimeOffset createDate =
			TimeProvider.GetUtcNow();

		EmailQueueEntry entry =
			new()
			{
				EmailType = EmailTypeConstants.Welcome,
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
		Result result =
			await MarkEmailFailedCommandHandler.HandleAsync(
				command,
				dbContext,
				TimeProvider,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeTrue();

		EmailQueueEntry? updatedEntry =
			await dbContext.EmailQueue.FindAsync(
				entry.Id);
		updatedEntry.ShouldNotBeNull();
		updatedEntry.ErrorMessage.ShouldNotBeNull();
		updatedEntry.ErrorMessage.Length.ShouldBeLessThanOrEqualTo(1000);
	}

	[Fact]
	public async Task HandleAsync_ReturnsFailure_WhenEntryNotFoundAsync()
	{
		// Arrange
		await using ElectronicNotificationsDbContext dbContext =
			CreateInMemoryDbContext();

		MarkEmailFailedCommand command =
			new(999, "Error");

		// Act
		Result result =
			await MarkEmailFailedCommandHandler.HandleAsync(
				command,
				dbContext,
				TimeProvider,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error.ShouldNotBeNull();
		result.Error.ShouldContain("not found");
	}

	[Fact]
	public async Task HandleAsync_AlreadySent_ReturnsSuccessWithoutModifyingAsync()
	{
		// Arrange
		await using ElectronicNotificationsDbContext dbContext =
			CreateInMemoryDbContext();

		EmailQueueEntry entry =
			new()
			{
				EmailType = EmailTypeConstants.Welcome,
				RecipientEmail = "test@example.com",
				TemplateData = "{}",
				Status = EmailQueueStatus.Sent,
				Attempts = 1,
				CreateDate = TimeProvider.GetUtcNow(),
				IdempotencyKey = Guid.NewGuid()
			};

		dbContext.EmailQueue.Add(entry);
		await dbContext.SaveChangesAsync();

		MarkEmailFailedCommand command =
			new(entry.Id, "Some error");

		// Act
		Result result =
			await MarkEmailFailedCommandHandler.HandleAsync(
				command,
				dbContext,
				TimeProvider,
				CancellationToken.None);

		// Assert — idempotent: already-Sent must not be overwritten to Failed
		result.IsSuccess.ShouldBeTrue();

		EmailQueueEntry? unchanged =
			await dbContext.EmailQueue.FindAsync(entry.Id);
		unchanged.ShouldNotBeNull();
		unchanged.Status.ShouldBe(EmailQueueStatus.Sent);
		unchanged.Attempts.ShouldBe(1);
	}

	[Fact]
	public async Task HandleAsync_AlreadyDeadLetter_ReturnsSuccessWithoutModifyingAsync()
	{
		// Arrange
		await using ElectronicNotificationsDbContext dbContext =
			CreateInMemoryDbContext();

		EmailQueueEntry entry =
			new()
			{
				EmailType = EmailTypeConstants.Welcome,
				RecipientEmail = "test@example.com",
				TemplateData = "{}",
				Status = EmailQueueStatus.DeadLetter,
				Attempts = 3,
				MaxAttempts = 3,
				CreateDate = TimeProvider.GetUtcNow(),
				IdempotencyKey = Guid.NewGuid()
			};

		dbContext.EmailQueue.Add(entry);
		await dbContext.SaveChangesAsync();

		MarkEmailFailedCommand command =
			new(entry.Id, "Some error");

		// Act
		Result result =
			await MarkEmailFailedCommandHandler.HandleAsync(
				command,
				dbContext,
				TimeProvider,
				CancellationToken.None);

		// Assert — idempotent: DeadLetter is a terminal state and must not be re-processed
		result.IsSuccess.ShouldBeTrue();

		EmailQueueEntry? unchanged =
			await dbContext.EmailQueue.FindAsync(entry.Id);
		unchanged.ShouldNotBeNull();
		unchanged.Status.ShouldBe(EmailQueueStatus.DeadLetter);
		unchanged.Attempts.ShouldBe(3);
	}
}