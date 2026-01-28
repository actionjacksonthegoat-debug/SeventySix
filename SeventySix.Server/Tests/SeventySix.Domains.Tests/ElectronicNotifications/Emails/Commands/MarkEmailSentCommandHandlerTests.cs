// <copyright file="MarkEmailSentCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;
using SeventySix.ElectronicNotifications;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Shared.POCOs;
using SeventySix.TestUtilities.Constants;
using Shouldly;

namespace SeventySix.Domains.Tests.ElectronicNotifications.Emails.Commands;

/// <summary>
/// Unit tests for <see cref="MarkEmailSentCommandHandler"/>.
/// </summary>
/// <remarks>
/// Coverage Focus:
/// - Status update to Sent
/// - SentAt timestamp setting
/// - Handling of non-existent entries.
/// </remarks>
public class MarkEmailSentCommandHandlerTests
{
	private readonly FakeTimeProvider TimeProvider;

	public MarkEmailSentCommandHandlerTests()
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
	public async Task HandleAsync_UpdatesStatusToSent_WhenEntryExistsAsync()
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
				CreateDate = createDate,
				IdempotencyKey = Guid.NewGuid()
			};

		dbContext.EmailQueue.Add(entry);
		await dbContext.SaveChangesAsync();

		MarkEmailSentCommand command =
			new(entry.Id);

		// Act
		Result result =
			await MarkEmailSentCommandHandler.HandleAsync(
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
		updatedEntry.Status.ShouldBe(EmailQueueStatus.Sent);
		updatedEntry.SentAt.ShouldNotBeNull();
		updatedEntry.SentAt.Value.ShouldBe(
			TimeProvider.GetUtcNow().UtcDateTime);
	}

	[Fact]
	public async Task HandleAsync_ReturnsFailure_WhenEntryNotFoundAsync()
	{
		// Arrange
		await using ElectronicNotificationsDbContext dbContext =
			CreateInMemoryDbContext();

		MarkEmailSentCommand command =
			new(999);

		// Act
		Result result =
			await MarkEmailSentCommandHandler.HandleAsync(
				command,
				dbContext,
				TimeProvider,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error.ShouldNotBeNull();
		result.Error.ShouldContain("not found");
	}
}