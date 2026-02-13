// <copyright file="OrphanedRegistrationCleanupJobHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Identity.Jobs;
using SeventySix.Identity.Settings;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Identity.Tests.Jobs;

/// <summary>
/// Integration tests for <see cref="OrphanedRegistrationCleanupJobHandler"/>.
/// Tests verify that orphaned registration users are properly cleaned up.
/// </summary>
/// <remarks>
/// 80/20 Focus: Tests the critical cleanup logic with real database.
/// Covers all boundary conditions: orphaned, active, confirmed, and recent users.
/// </remarks>
[Collection(CollectionNames.IdentityPostgreSql)]
public class OrphanedRegistrationCleanupJobHandlerTests(
	IdentityPostgreSqlFixture fixture) : DataPostgreSqlTestBase(fixture)
{
	private static readonly DateTimeOffset TestTime =
		TestTimeProviderBuilder.DefaultTime;

	/// <summary>
	/// Verifies that orphaned users older than retention period are deleted.
	/// </summary>
	[Fact]
	public async Task HandleAsync_OrphanedUsersExist_DeletesExpiredUsersAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider =
			new(TestTime);

		await using IdentityDbContext context =
			CreateIdentityDbContext();

		OrphanedRegistrationCleanupSettings settings =
			new()
			{
				RetentionHours = 48,
				IntervalHours = 24,
			};

		IRecurringJobService recurringJobService =
			Substitute.For<IRecurringJobService>();

		OrphanedRegistrationCleanupJobHandler handler =
			new(
				context,
				recurringJobService,
				Options.Create(settings),
				timeProvider,
				NullLogger<OrphanedRegistrationCleanupJobHandler>.Instance);

		// Create an orphaned user older than retention (created 72 hours ago)
		ApplicationUser orphanedUser =
			new UserBuilder(timeProvider)
				.WithUsername($"orphan_{Guid.NewGuid():N}"[..16])
				.WithEmail($"orphan+{Guid.NewGuid():N}@example.com")
				.Build();

		orphanedUser.IsActive = false;
		orphanedUser.EmailConfirmed = false;
		orphanedUser.CreateDate =
			TestTime.AddHours(-72).UtcDateTime;

		context.Users.Add(orphanedUser);
		await context.SaveChangesAsync();

		long orphanedUserId = orphanedUser.Id;

		// Act
		await handler.HandleAsync(
			new OrphanedRegistrationCleanupJob(),
			CancellationToken.None);

		// Assert — orphaned user should be deleted
		bool userExists =
			await context.Users
				.AnyAsync(user => user.Id == orphanedUserId);

		userExists.ShouldBeFalse();
	}

	/// <summary>
	/// Verifies that no deletions occur when all users are valid.
	/// </summary>
	[Fact]
	public async Task HandleAsync_NoOrphanedUsers_DoesNothingAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider =
			new(TestTime);

		await using IdentityDbContext context =
			CreateIdentityDbContext();

		OrphanedRegistrationCleanupSettings settings =
			new()
			{
				RetentionHours = 48,
				IntervalHours = 24,
			};

		IRecurringJobService recurringJobService =
			Substitute.For<IRecurringJobService>();

		OrphanedRegistrationCleanupJobHandler handler =
			new(
				context,
				recurringJobService,
				Options.Create(settings),
				timeProvider,
				NullLogger<OrphanedRegistrationCleanupJobHandler>.Instance);

		// Create an active, confirmed user
		ApplicationUser activeUser =
			new UserBuilder(timeProvider)
				.WithUsername($"active_{Guid.NewGuid():N}"[..16])
				.WithEmail($"active+{Guid.NewGuid():N}@example.com")
				.Build();

		activeUser.IsActive = true;
		activeUser.EmailConfirmed = true;
		activeUser.CreateDate =
			TestTime.AddHours(-72).UtcDateTime;

		context.Users.Add(activeUser);
		await context.SaveChangesAsync();

		int userCountBefore =
			await context.Users.CountAsync();

		// Act
		await handler.HandleAsync(
			new OrphanedRegistrationCleanupJob(),
			CancellationToken.None);

		// Assert — no users should be deleted
		int userCountAfter =
			await context.Users.CountAsync();

		userCountAfter.ShouldBeGreaterThanOrEqualTo(userCountBefore);
	}

	/// <summary>
	/// Verifies that active users are never deleted regardless of email confirmation.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ActiveUnconfirmedUser_DoesNotDeleteAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider =
			new(TestTime);

		await using IdentityDbContext context =
			CreateIdentityDbContext();

		OrphanedRegistrationCleanupSettings settings =
			new()
			{
				RetentionHours = 48,
				IntervalHours = 24,
			};

		IRecurringJobService recurringJobService =
			Substitute.For<IRecurringJobService>();

		OrphanedRegistrationCleanupJobHandler handler =
			new(
				context,
				recurringJobService,
				Options.Create(settings),
				timeProvider,
				NullLogger<OrphanedRegistrationCleanupJobHandler>.Instance);

		// Create an active but unconfirmed user (should NOT be deleted)
		ApplicationUser activeUnconfirmedUser =
			new UserBuilder(timeProvider)
				.WithUsername($"actunc_{Guid.NewGuid():N}"[..16])
				.WithEmail($"actunc+{Guid.NewGuid():N}@example.com")
				.Build();

		activeUnconfirmedUser.IsActive = true;
		activeUnconfirmedUser.EmailConfirmed = false;
		activeUnconfirmedUser.CreateDate =
			TestTime.AddHours(-72).UtcDateTime;

		context.Users.Add(activeUnconfirmedUser);
		await context.SaveChangesAsync();

		long userId = activeUnconfirmedUser.Id;

		// Act
		await handler.HandleAsync(
			new OrphanedRegistrationCleanupJob(),
			CancellationToken.None);

		// Assert — active user should NOT be deleted
		bool userExists =
			await context.Users
				.AnyAsync(user => user.Id == userId);

		userExists.ShouldBeTrue();
	}

	/// <summary>
	/// Verifies that users who confirmed email are never deleted regardless of active status.
	/// </summary>
	[Fact]
	public async Task HandleAsync_InactiveConfirmedUser_DoesNotDeleteAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider =
			new(TestTime);

		await using IdentityDbContext context =
			CreateIdentityDbContext();

		OrphanedRegistrationCleanupSettings settings =
			new()
			{
				RetentionHours = 48,
				IntervalHours = 24,
			};

		IRecurringJobService recurringJobService =
			Substitute.For<IRecurringJobService>();

		OrphanedRegistrationCleanupJobHandler handler =
			new(
				context,
				recurringJobService,
				Options.Create(settings),
				timeProvider,
				NullLogger<OrphanedRegistrationCleanupJobHandler>.Instance);

		// Create an inactive but confirmed user (should NOT be deleted)
		ApplicationUser inactiveConfirmedUser =
			new UserBuilder(timeProvider)
				.WithUsername($"inacon_{Guid.NewGuid():N}"[..16])
				.WithEmail($"inacon+{Guid.NewGuid():N}@example.com")
				.Build();

		inactiveConfirmedUser.IsActive = false;
		inactiveConfirmedUser.EmailConfirmed = true;
		inactiveConfirmedUser.CreateDate =
			TestTime.AddHours(-72).UtcDateTime;

		context.Users.Add(inactiveConfirmedUser);
		await context.SaveChangesAsync();

		long userId = inactiveConfirmedUser.Id;

		// Act
		await handler.HandleAsync(
			new OrphanedRegistrationCleanupJob(),
			CancellationToken.None);

		// Assert — confirmed user should NOT be deleted
		bool userExists =
			await context.Users
				.AnyAsync(user => user.Id == userId);

		userExists.ShouldBeTrue();
	}

	/// <summary>
	/// Verifies that recent orphaned users within retention period are preserved.
	/// </summary>
	[Fact]
	public async Task HandleAsync_RecentOrphan_DoesNotDeleteAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider =
			new(TestTime);

		await using IdentityDbContext context =
			CreateIdentityDbContext();

		OrphanedRegistrationCleanupSettings settings =
			new()
			{
				RetentionHours = 48,
				IntervalHours = 24,
			};

		IRecurringJobService recurringJobService =
			Substitute.For<IRecurringJobService>();

		OrphanedRegistrationCleanupJobHandler handler =
			new(
				context,
				recurringJobService,
				Options.Create(settings),
				timeProvider,
				NullLogger<OrphanedRegistrationCleanupJobHandler>.Instance);

		// Create a recent orphan (created 12 hours ago — within 48-hour retention)
		ApplicationUser recentOrphan =
			new UserBuilder(timeProvider)
				.WithUsername($"recent_{Guid.NewGuid():N}"[..16])
				.WithEmail($"recent+{Guid.NewGuid():N}@example.com")
				.Build();

		recentOrphan.IsActive = false;
		recentOrphan.EmailConfirmed = false;
		recentOrphan.CreateDate =
			TestTime.AddHours(-12).UtcDateTime;

		context.Users.Add(recentOrphan);
		await context.SaveChangesAsync();

		long userId = recentOrphan.Id;

		// Act
		await handler.HandleAsync(
			new OrphanedRegistrationCleanupJob(),
			CancellationToken.None);

		// Assert — recent orphan should NOT be deleted
		bool userExists =
			await context.Users
				.AnyAsync(user => user.Id == userId);

		userExists.ShouldBeTrue();
	}
}