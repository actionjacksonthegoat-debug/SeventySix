// <copyright file="DeleteLogsBatchCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.Logging;
using Shouldly;

namespace SeventySix.Domains.Tests.Logging.Commands.DeleteLogsBatch;

/// <summary>
/// Unit tests for <see cref="DeleteLogsBatchCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests batch delete operation with various input sizes.
/// Uses mocked repository since persistence is tested in LogRepositoryTests.
/// </remarks>
public class DeleteLogsBatchCommandHandlerTests
{
	private readonly ILogRepository Repository;

	/// <summary>
	/// Initializes a new instance of the <see cref="DeleteLogsBatchCommandHandlerTests"/> class.
	/// </summary>
	public DeleteLogsBatchCommandHandlerTests()
	{
		Repository =
			Substitute.For<ILogRepository>();
	}

	/// <summary>
	/// Tests that deleting multiple logs returns the correct count.
	/// </summary>
	[Fact]
	public async Task HandleAsync_MultipleIds_ReturnsDeletedCountAsync()
	{
		// Arrange
		long[] logIds =
			[1, 2, 3, 4, 5];
		DeleteLogsBatchCommand command =
			new(logIds);

		Repository
			.DeleteBatchAsync(
				logIds,
				Arg.Any<CancellationToken>())
			.Returns(5);

		// Act
		int deletedCount =
			await DeleteLogsBatchCommandHandler.HandleAsync(
				command,
				Repository,
				CancellationToken.None);

		// Assert
		deletedCount.ShouldBe(5);
	}

	/// <summary>
	/// Tests that empty array returns zero without error.
	/// </summary>
	[Fact]
	public async Task HandleAsync_EmptyArray_ReturnsZeroAsync()
	{
		// Arrange
		long[] logIds =
			[];
		DeleteLogsBatchCommand command =
			new(logIds);

		Repository
			.DeleteBatchAsync(
				logIds,
				Arg.Any<CancellationToken>())
			.Returns(0);

		// Act
		int deletedCount =
			await DeleteLogsBatchCommandHandler.HandleAsync(
				command,
				Repository,
				CancellationToken.None);

		// Assert
		deletedCount.ShouldBe(0);
	}

	/// <summary>
	/// Tests that partial match (some IDs not found) returns actual deleted count.
	/// </summary>
	[Fact]
	public async Task HandleAsync_PartialMatch_ReturnsActualDeletedCountAsync()
	{
		// Arrange
		long[] logIds =
			[1, 2, 999]; // 999 doesn't exist
		DeleteLogsBatchCommand command =
			new(logIds);

		Repository
			.DeleteBatchAsync(
				logIds,
				Arg.Any<CancellationToken>())
			.Returns(2); // Only 2 were found

		// Act
		int deletedCount =
			await DeleteLogsBatchCommandHandler.HandleAsync(
				command,
				Repository,
				CancellationToken.None);

		// Assert
		deletedCount.ShouldBe(2);
	}

	/// <summary>
	/// Tests that the handler passes the correct IDs to the repository.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ValidCommand_PassesCorrectIdsToRepositoryAsync()
	{
		// Arrange
		long[] logIds =
			[10, 20, 30];
		DeleteLogsBatchCommand command =
			new(logIds);

		Repository
			.DeleteBatchAsync(
				Arg.Any<long[]>(),
				Arg.Any<CancellationToken>())
			.Returns(3);

		// Act
		await DeleteLogsBatchCommandHandler.HandleAsync(
			command,
			Repository,
			CancellationToken.None);

		// Assert
		await Repository
			.Received(1)
			.DeleteBatchAsync(
				logIds,
				Arg.Any<CancellationToken>());
	}
}