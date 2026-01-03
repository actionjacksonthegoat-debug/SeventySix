// <copyright file="EnqueueEmailCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using SeventySix.ElectronicNotifications;
using SeventySix.ElectronicNotifications.Emails;
using Shouldly;

namespace SeventySix.Domains.Tests.ElectronicNotifications.Emails.Commands;

/// <summary>
/// Unit tests for <see cref="EnqueueEmailCommandHandler"/>.
/// </summary>
/// <remarks>
/// Coverage Focus:
/// - Email queue entry creation
/// - Idempotency key handling (deduplication)
/// - Template data serialization.
/// </remarks>
public class EnqueueEmailCommandHandlerTests
{
	private readonly FakeTimeProvider TimeProvider;
	private readonly IOptions<EmailQueueSettings> Settings;

	public EnqueueEmailCommandHandlerTests()
	{
		TimeProvider =
			new FakeTimeProvider();
		TimeProvider.SetUtcNow(
			new DateTimeOffset(2026, 1, 3, 12, 0, 0, TimeSpan.Zero));

		Settings =
			Options.Create(
				new EmailQueueSettings
				{
					Enabled = true,
					MaxAttempts = 3,
					ProcessingIntervalSeconds = 30,
					BatchSize = 50,
					RetryDelayMinutes = 5,
					DeadLetterAfterHours = 24
				});
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
	public async Task HandleAsync_CreatesEmailQueueEntry_WithCorrectValuesAsync()
	{
		// Arrange
		await using ElectronicNotificationsDbContext dbContext =
			CreateInMemoryDbContext();

		Dictionary<string, string> templateData =
			new()
			{
				["username"] = "testuser",
				["resetToken"] = "123:abc"
			};

		EnqueueEmailCommand command =
			new(
				EmailType.Welcome,
				"test@example.com",
				1,
				templateData);

		// Act
		long entryId =
			await EnqueueEmailCommandHandler.HandleAsync(
				command,
				dbContext,
				Settings,
				TimeProvider,
				CancellationToken.None);

		// Assert
		entryId.ShouldBeGreaterThan(0);

		EmailQueueEntry? entry =
			await dbContext.EmailQueue.FindAsync(entryId);
		entry.ShouldNotBeNull();
		entry.EmailType.ShouldBe(EmailType.Welcome);
		entry.RecipientEmail.ShouldBe("test@example.com");
		entry.RecipientUserId.ShouldBe(1);
		entry.Status.ShouldBe(EmailQueueStatus.Pending);
		entry.Attempts.ShouldBe(0);
		entry.MaxAttempts.ShouldBe(3);
		entry.TemplateData.ShouldContain("testuser");
		entry.TemplateData.ShouldContain("resetToken");
	}

	[Fact]
	public async Task HandleAsync_ReturnsExistingEntryId_WhenDuplicateAsync()
	{
		// Arrange
		await using ElectronicNotificationsDbContext dbContext =
			CreateInMemoryDbContext();

		Dictionary<string, string> templateData =
			new()
			{
				["username"] = "testuser",
				["resetToken"] = "123:abc"
			};

		Guid idempotencyKey =
			Guid.NewGuid();

		EnqueueEmailCommand command =
			new(
				EmailType.Welcome,
				"test@example.com",
				1,
				templateData,
				idempotencyKey);

		// Act - Enqueue same command twice with same idempotency key
		long firstEntryId =
			await EnqueueEmailCommandHandler.HandleAsync(
				command,
				dbContext,
				Settings,
				TimeProvider,
				CancellationToken.None);

		long secondEntryId =
			await EnqueueEmailCommandHandler.HandleAsync(
				command,
				dbContext,
				Settings,
				TimeProvider,
				CancellationToken.None);

		// Assert - Should return same ID (idempotent)
		secondEntryId.ShouldBe(firstEntryId);

		int count =
			await dbContext.EmailQueue.CountAsync();
		count.ShouldBe(1);
	}

	[Fact]
	public async Task HandleAsync_CreatesSeparateEntries_ForDifferentEmailTypesAsync()
	{
		// Arrange
		await using ElectronicNotificationsDbContext dbContext =
			CreateInMemoryDbContext();

		Dictionary<string, string> templateData =
			new()
			{
				["username"] = "testuser",
				["resetToken"] = "123:abc"
			};

		EnqueueEmailCommand welcomeCommand =
			new(
				EmailType.Welcome,
				"test@example.com",
				1,
				templateData);

		EnqueueEmailCommand resetCommand =
			new(
				EmailType.PasswordReset,
				"test@example.com",
				1,
				templateData);

		// Act
		long welcomeEntryId =
			await EnqueueEmailCommandHandler.HandleAsync(
				welcomeCommand,
				dbContext,
				Settings,
				TimeProvider,
				CancellationToken.None);

		long resetEntryId =
			await EnqueueEmailCommandHandler.HandleAsync(
				resetCommand,
				dbContext,
				Settings,
				TimeProvider,
				CancellationToken.None);

		// Assert - Should create separate entries
		welcomeEntryId.ShouldNotBe(resetEntryId);

		int count =
			await dbContext.EmailQueue.CountAsync();
		count.ShouldBe(2);
	}

	[Fact]
	public async Task HandleAsync_SetsCorrectCreateDate_FromTimeProviderAsync()
	{
		// Arrange
		await using ElectronicNotificationsDbContext dbContext =
			CreateInMemoryDbContext();

		DateTime expectedDate =
			TimeProvider.GetUtcNow().UtcDateTime;

		EnqueueEmailCommand command =
			new(
				EmailType.Verification,
				"test@example.com",
				1,
				[]);

		// Act
		long entryId =
			await EnqueueEmailCommandHandler.HandleAsync(
				command,
				dbContext,
				Settings,
				TimeProvider,
				CancellationToken.None);

		// Assert
		EmailQueueEntry? entry =
			await dbContext.EmailQueue.FindAsync(entryId);
		entry.ShouldNotBeNull();
		entry.CreateDate.ShouldBe(expectedDate);
	}
}
