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
public class CreateClientLogBatchCommandHandlerTests
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
			.CreateAsync(
				Arg.Any<Log>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that each request creates a corresponding log entry.
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

		List<Log> capturedLogs =
			[];

		Repository
			.CreateAsync(
				Arg.Do<Log>(log => capturedLogs.Add(log)),
				Arg.Any<CancellationToken>())
			.Returns(
				callInfo => Task.FromResult(callInfo.Arg<Log>()));

		// Act
		await CreateClientLogBatchCommandHandler.HandleAsync(
			requests,
			Repository,
			CancellationToken.None);

		// Assert
		capturedLogs.Count.ShouldBe(3);
		capturedLogs[0].Message.ShouldBe("First error");
		capturedLogs[0].LogLevel.ShouldBe("Error");
		capturedLogs[1].Message.ShouldBe("Second warning");
		capturedLogs[1].LogLevel.ShouldBe("Warning");
		capturedLogs[2].Message.ShouldBe("Third info");
		capturedLogs[2].LogLevel.ShouldBe("Information");

		// Verify repository called for each
		await Repository
			.Received(3)
			.CreateAsync(
				Arg.Any<Log>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that single request creates exactly one log.
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

		Repository
			.CreateAsync(
				Arg.Any<Log>(),
				Arg.Any<CancellationToken>())
			.Returns(
				callInfo => Task.FromResult(callInfo.Arg<Log>()));

		// Act
		await CreateClientLogBatchCommandHandler.HandleAsync(
			requests,
			Repository,
			CancellationToken.None);

		// Assert
		await Repository
			.Received(1)
			.CreateAsync(
				Arg.Any<Log>(),
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

		List<Log> capturedLogs =
			[];

		Repository
			.CreateAsync(
				Arg.Do<Log>(log => capturedLogs.Add(log)),
				Arg.Any<CancellationToken>())
			.Returns(
				callInfo => Task.FromResult(callInfo.Arg<Log>()));

		// Act
		await CreateClientLogBatchCommandHandler.HandleAsync(
			requests,
			Repository,
			CancellationToken.None);

		// Assert
		foreach (Log log in capturedLogs)
		{
			log.MachineName.ShouldBe("Browser");
			log.Environment.ShouldBe("Client");
		}
	}
}
