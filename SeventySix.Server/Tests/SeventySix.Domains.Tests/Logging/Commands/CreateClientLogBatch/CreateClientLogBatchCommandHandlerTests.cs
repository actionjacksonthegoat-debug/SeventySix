// <copyright file="CreateClientLogBatchCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.Logging;
using Shouldly;

namespace SeventySix.Domains.Tests.Logging.Commands.CreateClientLogBatch;

/// <summary>
/// Unit tests for <see cref="CreateClientLogBatchCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests batch processing and early return for empty arrays.
/// Uses mocked repository since persistence is tested in LogRepositoryTests.
/// </remarks>
public sealed class CreateClientLogBatchCommandHandlerTests
{
	private readonly ILogRepository Repository;

	/// <summary>
	/// Initializes a new instance of the <see cref="CreateClientLogBatchCommandHandlerTests"/> class.
	/// </summary>
	public CreateClientLogBatchCommandHandlerTests()
	{
		Repository =
			Substitute.For<ILogRepository>();
	}

	/// <summary>
	/// Tests that empty array returns early without calling repository.
	/// </summary>
	[Fact]
	public async Task HandleAsync_EmptyArray_DoesNotCallRepositoryAsync()
	{
		// Arrange
		CreateLogRequest[] requests =
			[];

		// Act
		await CreateClientLogBatchCommandHandler.HandleAsync(
			requests,
			Repository,
			CancellationToken.None);

		// Assert
		await Repository
			.DidNotReceive()
			.CreateBatchAsync(
				Arg.Any<IEnumerable<Log>>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that multiple requests create all logs in single batch call.
	/// </summary>
	[Fact]
	public async Task HandleAsync_MultipleRequests_CreatesAllLogsAsync()
	{
		// Arrange
		CreateLogRequest[] requests =
			[
				new()
				{
					LogLevel = "Error",
					Message = "First error",
				},
				new()
				{
					LogLevel = "Warning",
					Message = "Second warning",
				},
				new()
				{
					LogLevel = "Information",
					Message = "Third info",
				},
			];

		IEnumerable<Log>? capturedLogs =
			null;

		Repository
			.CreateBatchAsync(
				Arg.Do<IEnumerable<Log>>(
					logs => capturedLogs = logs.ToList()),
				Arg.Any<CancellationToken>())
			.Returns(Task.CompletedTask);

		// Act
		await CreateClientLogBatchCommandHandler.HandleAsync(
			requests,
			Repository,
			CancellationToken.None);

		// Assert
		capturedLogs.ShouldNotBeNull();
		List<Log> logsList =
			capturedLogs.ToList();
		logsList.Count.ShouldBe(3);
		logsList[0].Message.ShouldBe("First error");
		logsList[0].LogLevel.ShouldBe("Error");
		logsList[1].Message.ShouldBe("Second warning");
		logsList[1].LogLevel.ShouldBe("Warning");
		logsList[2].Message.ShouldBe("Third info");
		logsList[2].LogLevel.ShouldBe("Information");

		// Verify repository called once with batch
		await Repository
			.Received(1)
			.CreateBatchAsync(
				Arg.Any<IEnumerable<Log>>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that single request creates exactly one log via batch call.
	/// </summary>
	[Fact]
	public async Task HandleAsync_SingleRequest_CreatesOneLogAsync()
	{
		// Arrange
		CreateLogRequest[] requests =
			[
				new()
				{
					LogLevel = "Debug",
					Message = "Single log",
				},
			];

		IEnumerable<Log>? capturedLogs =
			null;

		Repository
			.CreateBatchAsync(
				Arg.Do<IEnumerable<Log>>(
					logs => capturedLogs = logs.ToList()),
				Arg.Any<CancellationToken>())
			.Returns(Task.CompletedTask);

		// Act
		await CreateClientLogBatchCommandHandler.HandleAsync(
			requests,
			Repository,
			CancellationToken.None);

		// Assert
		capturedLogs.ShouldNotBeNull();
		capturedLogs.Count().ShouldBe(1);

		await Repository
			.Received(1)
			.CreateBatchAsync(
				Arg.Any<IEnumerable<Log>>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that all logs get consistent environment and machine name.
	/// </summary>
	[Fact]
	public async Task HandleAsync_AllLogs_HaveClientContextAsync()
	{
		// Arrange
		CreateLogRequest[] requests =
			[
				new() { LogLevel = "Error", Message = "One" },
				new() { LogLevel = "Warning", Message = "Two" },
			];

		IEnumerable<Log>? capturedLogs =
			null;

		Repository
			.CreateBatchAsync(
				Arg.Do<IEnumerable<Log>>(
					logs => capturedLogs = logs.ToList()),
				Arg.Any<CancellationToken>())
			.Returns(Task.CompletedTask);

		// Act
		await CreateClientLogBatchCommandHandler.HandleAsync(
			requests,
			Repository,
			CancellationToken.None);

		// Assert
		capturedLogs.ShouldNotBeNull();
		foreach (Log log in capturedLogs)
		{
			log.MachineName.ShouldBe("Browser");
			log.Environment.ShouldBe("Client");
		}
	}
}