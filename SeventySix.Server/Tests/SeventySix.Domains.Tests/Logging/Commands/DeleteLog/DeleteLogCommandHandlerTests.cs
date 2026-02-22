// <copyright file="DeleteLogCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.Logging;
using SeventySix.Shared.POCOs;
using Shouldly;

namespace SeventySix.Domains.Tests.Logging.Commands.DeleteLog;

/// <summary>
/// Unit tests for <see cref="DeleteLogCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests the delete operation's success and failure paths.
/// Uses mocked repository since persistence is tested in LogRepositoryTests.
/// </remarks>
public sealed class DeleteLogCommandHandlerTests
{
	private readonly ILogRepository Repository;

	/// <summary>
	/// Initializes a new instance of the <see cref="DeleteLogCommandHandlerTests"/> class.
	/// </summary>
	public DeleteLogCommandHandlerTests()
	{
		Repository =
			Substitute.For<ILogRepository>();
	}

	/// <summary>
	/// Tests that deleting an existing log returns success.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ExistingLog_ReturnsSuccessAsync()
	{
		// Arrange
		long logId = 123;
		DeleteLogCommand command =
			new(logId);

		Repository
			.DeleteByIdAsync(
				logId,
				Arg.Any<CancellationToken>())
			.Returns(true);

		// Act
		Result result =
			await DeleteLogCommandHandler.HandleAsync(
				command,
				Repository,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeTrue();
	}

	/// <summary>
	/// Tests that deleting a non-existent log returns failure.
	/// </summary>
	[Fact]
	public async Task HandleAsync_NonExistentLog_ReturnsFailureAsync()
	{
		// Arrange
		long logId = 999;
		DeleteLogCommand command =
			new(logId);

		Repository
			.DeleteByIdAsync(
				logId,
				Arg.Any<CancellationToken>())
			.Returns(false);

		// Act
		Result result =
			await DeleteLogCommandHandler.HandleAsync(
				command,
				Repository,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error!.ShouldContain("not found");
	}

	/// <summary>
	/// Tests that the handler passes the correct log ID to the repository.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ValidCommand_PassesCorrectIdToRepositoryAsync()
	{
		// Arrange
		long logId = 456;
		DeleteLogCommand command =
			new(logId);

		Repository
			.DeleteByIdAsync(
				Arg.Any<long>(),
				Arg.Any<CancellationToken>())
			.Returns(true);

		// Act
		await DeleteLogCommandHandler.HandleAsync(
			command,
			Repository,
			CancellationToken.None);

		// Assert
		await Repository
			.Received(1)
			.DeleteByIdAsync(
				logId,
				Arg.Any<CancellationToken>());
	}
}