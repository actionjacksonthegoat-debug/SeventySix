// <copyright file="CartSessionCleanupJobHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using SeventySix.EcommerceCleanup.Jobs;
using SeventySix.EcommerceCleanup.Repositories;
using SeventySix.EcommerceCleanup.Settings;
using SeventySix.Shared.BackgroundJobs;
using Shouldly;

namespace SeventySix.Domains.Tests.EcommerceCleanup.Jobs;

/// <summary>
/// Unit tests for <see cref="CartSessionCleanupJobHandler"/>.
/// </summary>
public sealed class CartSessionCleanupJobHandlerTests
{
	private readonly IEcommerceCleanupRepository Repository =
		Substitute.For<IEcommerceCleanupRepository>();

	private readonly IRecurringJobService RecurringJobService =
		Substitute.For<IRecurringJobService>();

	private readonly FakeTimeProvider TimeProvider =
		new(new DateTimeOffset(2026, 6, 15, 3, 0, 0, TimeSpan.Zero));

	[Fact]
	public async Task HandleAsync_WhenEnabled_DeletesExpiredSessionsFromBothDatabasesAsync()
	{
		// Arrange
		EcommerceCleanupSettings settings =
			CreateValidSettings();

		Repository
			.DeleteExpiredCartSessionsAsync(
				settings.SvelteKitConnectionString,
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>())
			.Returns(5);

		Repository
			.DeleteExpiredCartSessionsAsync(
				settings.TanStackConnectionString,
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>())
			.Returns(3);

		CartSessionCleanupJobHandler handler =
			CreateHandler(settings);

		// Act
		await handler.HandleAsync(
			new CartSessionCleanupJob(),
			CancellationToken.None);

		// Assert
		await Repository
			.Received(1)
			.DeleteExpiredCartSessionsAsync(
				settings.SvelteKitConnectionString,
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>());

		await Repository
			.Received(1)
			.DeleteExpiredCartSessionsAsync(
				settings.TanStackConnectionString,
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task HandleAsync_WhenEnabled_CalculatesCutoffDateFromRetentionDaysAsync()
	{
		// Arrange
		EcommerceCleanupSettings settings =
			CreateValidSettings();

		DateTimeOffset expectedCutoff =
			TimeProvider.GetUtcNow().AddDays(-settings.CartSessions.RetentionDays);

		CartSessionCleanupJobHandler handler =
			CreateHandler(settings);

		// Act
		await handler.HandleAsync(
			new CartSessionCleanupJob(),
			CancellationToken.None);

		// Assert
		await Repository
			.Received()
			.DeleteExpiredCartSessionsAsync(
				Arg.Any<string>(),
				expectedCutoff,
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task HandleAsync_WhenDisabled_SkipsCleanupButReschedulesAsync()
	{
		// Arrange
		EcommerceCleanupSettings settings =
			CreateValidSettings() with { Enabled = false };

		CartSessionCleanupJobHandler handler =
			CreateHandler(settings);

		// Act
		await handler.HandleAsync(
			new CartSessionCleanupJob(),
			CancellationToken.None);

		// Assert
		await Repository
			.DidNotReceive()
			.DeleteExpiredCartSessionsAsync(
				Arg.Any<string>(),
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>());

		await RecurringJobService
			.Received(1)
			.RecordAndScheduleNextAnchoredAsync<CartSessionCleanupJob>(
				nameof(CartSessionCleanupJob),
				Arg.Any<DateTimeOffset>(),
				Arg.Any<TimeOnly>(),
				Arg.Any<TimeSpan>(),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task HandleAsync_WhenDatabaseErrorOccurs_ReschedulesNormallyAsync()
	{
		// Arrange
		EcommerceCleanupSettings settings =
			CreateValidSettings();

		Repository
			.DeleteExpiredCartSessionsAsync(
				settings.SvelteKitConnectionString,
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>())
			.ThrowsAsync(new InvalidOperationException("Connection failed"));

		CartSessionCleanupJobHandler handler =
			CreateHandler(settings);

		// Act
		await handler.HandleAsync(
			new CartSessionCleanupJob(),
			CancellationToken.None);

		// Assert — job still reschedules despite error
		await RecurringJobService
			.Received(1)
			.RecordAndScheduleNextAnchoredAsync<CartSessionCleanupJob>(
				nameof(CartSessionCleanupJob),
				Arg.Any<DateTimeOffset>(),
				Arg.Any<TimeOnly>(),
				Arg.Any<TimeSpan>(),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task HandleAsync_WhenSvelteKitFails_StillCleansTanStackAsync()
	{
		// Arrange
		EcommerceCleanupSettings settings =
			CreateValidSettings();

		Repository
			.DeleteExpiredCartSessionsAsync(
				settings.SvelteKitConnectionString,
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>())
			.ThrowsAsync(new InvalidOperationException("SvelteKit DB unavailable"));

		Repository
			.DeleteExpiredCartSessionsAsync(
				settings.TanStackConnectionString,
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>())
			.Returns(2);

		CartSessionCleanupJobHandler handler =
			CreateHandler(settings);

		// Act
		await handler.HandleAsync(
			new CartSessionCleanupJob(),
			CancellationToken.None);

		// Assert — TanStack cleanup still occurred
		await Repository
			.Received(1)
			.DeleteExpiredCartSessionsAsync(
				settings.TanStackConnectionString,
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task HandleAsync_AlwaysReschedulesWithCorrectIntervalAsync()
	{
		// Arrange
		EcommerceCleanupSettings settings =
			CreateValidSettings();

		TimeSpan expectedInterval =
			TimeSpan.FromHours(settings.CartSessions.IntervalHours);

		TimeOnly expectedPreferredTime =
			new(
				settings.CartSessions.PreferredStartHourUtc,
				settings.CartSessions.PreferredStartMinuteUtc);

		CartSessionCleanupJobHandler handler =
			CreateHandler(settings);

		// Act
		await handler.HandleAsync(
			new CartSessionCleanupJob(),
			CancellationToken.None);

		// Assert
		await RecurringJobService
			.Received(1)
			.RecordAndScheduleNextAnchoredAsync<CartSessionCleanupJob>(
				nameof(CartSessionCleanupJob),
				TimeProvider.GetUtcNow(),
				expectedPreferredTime,
				expectedInterval,
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task HandleAsync_WhenNoExpiredSessions_CompletesWithoutErrorAsync()
	{
		// Arrange
		EcommerceCleanupSettings settings =
			CreateValidSettings();

		Repository
			.DeleteExpiredCartSessionsAsync(
				Arg.Any<string>(),
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>())
			.Returns(0);

		CartSessionCleanupJobHandler handler =
			CreateHandler(settings);

		// Act
		await handler.HandleAsync(
			new CartSessionCleanupJob(),
			CancellationToken.None);

		// Assert — completed without error, rescheduled
		await RecurringJobService
			.Received(1)
			.RecordAndScheduleNextAnchoredAsync<CartSessionCleanupJob>(
				Arg.Any<string>(),
				Arg.Any<DateTimeOffset>(),
				Arg.Any<TimeOnly>(),
				Arg.Any<TimeSpan>(),
				Arg.Any<CancellationToken>());
	}

	private CartSessionCleanupJobHandler CreateHandler(
		EcommerceCleanupSettings settings) =>
		new(
			Repository,
			RecurringJobService,
			Options.Create(settings),
			TimeProvider,
			NullLogger<CartSessionCleanupJobHandler>.Instance);

	private static EcommerceCleanupSettings CreateValidSettings() =>
		new()
		{
			Enabled = true,
			SvelteKitConnectionString = "Host=localhost;Port=5439;Database=test_sveltekit;Username=test",
			TanStackConnectionString = "Host=localhost;Port=5438;Database=test_tanstack;Username=test",
			CartSessions = new CartSessionCleanupSettings
			{
				RetentionDays = 30,
				IntervalHours = 24,
				PreferredStartHourUtc = 3,
				PreferredStartMinuteUtc = 0,
			},
		};
}