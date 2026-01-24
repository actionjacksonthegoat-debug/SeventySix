// <copyright file="DeleteLogsOlderThanCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.Logging;
using Shouldly;

namespace SeventySix.Domains.Tests.Logging.Commands.DeleteLogsOlderThan;

/// <summary>
/// Unit tests for <see cref="DeleteLogsOlderThanCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests date-based cleanup operation.
/// Uses mocked repository since persistence is tested in LogRepositoryTests.
/// </remarks>
public class DeleteLogsOlderThanCommandHandlerTests
{
	private readonly ILogRepository Repository;

	/// <summary>
	/// Initializes a new instance of the <see cref="DeleteLogsOlderThanCommandHandlerTests"/> class.
	/// </summary>
	public DeleteLogsOlderThanCommandHandlerTests()
	{
		Repository =
			Substitute.For<ILogRepository>();
	}

	/// <summary>
	/// Tests that cleanup returns the count of deleted logs.
	/// </summary>
	[Fact]
	public async Task HandleAsync_OldLogsExist_ReturnsDeletedCountAsync()
	{
		// Arrange
		DateTime cutoffDate =
			new(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
		DeleteLogsOlderThanCommand command =
			new(cutoffDate);

		Repository
			.DeleteOlderThanAsync(
				cutoffDate,
				Arg.Any<CancellationToken>())
			.Returns(100);

		// Act
		int deletedCount =
			await DeleteLogsOlderThanCommandHandler.HandleAsync(
				command,
				Repository,
				CancellationToken.None);

		// Assert
		deletedCount.ShouldBe(100);
	}

	/// <summary>
	/// Tests that no logs to delete returns zero.
	/// </summary>
	[Fact]
	public async Task HandleAsync_NoOldLogs_ReturnsZeroAsync()
	{
		// Arrange
		DateTime cutoffDate =
			new(2010, 1, 1, 0, 0, 0, DateTimeKind.Utc); // Very old cutoff, no logs that old
		DeleteLogsOlderThanCommand command =
			new(cutoffDate);

		Repository
			.DeleteOlderThanAsync(
				cutoffDate,
				Arg.Any<CancellationToken>())
			.Returns(0);

		// Act
		int deletedCount =
			await DeleteLogsOlderThanCommandHandler.HandleAsync(
				command,
				Repository,
				CancellationToken.None);

		// Assert
		deletedCount.ShouldBe(0);
	}

	/// <summary>
	/// Tests that the handler passes the correct cutoff date to the repository.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ValidCommand_PassesCorrectDateToRepositoryAsync()
	{
		// Arrange
		DateTime cutoffDate =
			new(2024, 1, 15, 0, 0, 0, DateTimeKind.Utc);
		DeleteLogsOlderThanCommand command =
			new(cutoffDate);

		Repository
			.DeleteOlderThanAsync(
				Arg.Any<DateTime>(),
				Arg.Any<CancellationToken>())
			.Returns(50);

		// Act
		await DeleteLogsOlderThanCommandHandler.HandleAsync(
			command,
			Repository,
			CancellationToken.None);

		// Assert
		await Repository
			.Received(1)
			.DeleteOlderThanAsync(
				cutoffDate,
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests cleanup with a recent cutoff date (edge case).
	/// </summary>
	[Fact]
	public async Task HandleAsync_RecentCutoffDate_DeletesRecentLogsAsync()
	{
		// Arrange
		DateTime cutoffDate =
			new(2025, 6, 1, 12, 0, 0, DateTimeKind.Utc); // A recent fixed cutoff
		DeleteLogsOlderThanCommand command =
			new(cutoffDate);

		Repository
			.DeleteOlderThanAsync(
				cutoffDate,
				Arg.Any<CancellationToken>())
			.Returns(500);

		// Act
		int deletedCount =
			await DeleteLogsOlderThanCommandHandler.HandleAsync(
				command,
				Repository,
				CancellationToken.None);

		// Assert
		deletedCount.ShouldBe(500);
	}
}