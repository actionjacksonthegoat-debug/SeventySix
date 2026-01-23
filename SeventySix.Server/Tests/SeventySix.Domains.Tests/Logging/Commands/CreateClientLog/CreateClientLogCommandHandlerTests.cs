// <copyright file="CreateClientLogCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.Logging;
using Shouldly;

namespace SeventySix.Domains.Tests.Logging.Commands.CreateClientLog;

/// <summary>
/// Unit tests for <see cref="CreateClientLogCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests the mapping of request to entity.
/// Uses mocked repository since persistence is tested in LogRepositoryTests.
/// </remarks>
public class CreateClientLogCommandHandlerTests
{
	private readonly ILogRepository Repository;

	/// <summary>
	/// Initializes a new instance of the <see cref="CreateClientLogCommandHandlerTests"/> class.
	/// </summary>
	public CreateClientLogCommandHandlerTests()
	{
		Repository =
			Substitute.For<ILogRepository>();
	}

	/// <summary>
	/// Tests that a valid request creates a log with correct field mappings.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ValidRequest_MapsFieldsCorrectlyAsync()
	{
		// Arrange
		CreateLogRequest request =
			new()
			{
				LogLevel = "Error",
				Message = "Test error message",
				ExceptionMessage = "Test exception",
				StackTrace = "at TestClass.Method()",
				SourceContext = "TestComponent",
				RequestUrl = "/api/test",
				RequestMethod = "POST",
				StatusCode = 500,
				CorrelationId = "corr-123",
				UserAgent = "TestBrowser/1.0",
				ClientTimestamp = "2024-01-15T10:30:00Z",
				AdditionalContext =
					new Dictionary<string, object> { ["key"] = "extra info" },
			};

		Log? capturedLog =
			null;

		Repository
			.CreateAsync(
				Arg.Do<Log>(log => capturedLog = log),
				Arg.Any<CancellationToken>())
			.Returns(
				callInfo => Task.FromResult(callInfo.Arg<Log>()));

		// Act
		await CreateClientLogCommandHandler.HandleAsync(
			request,
			Repository,
			CancellationToken.None);

		// Assert
		capturedLog.ShouldNotBeNull();
		capturedLog.LogLevel.ShouldBe("Error");
		capturedLog.Message.ShouldBe("Test error message");
		capturedLog.ExceptionMessage.ShouldBe("Test exception");
		capturedLog.StackTrace.ShouldBe("at TestClass.Method()");
		capturedLog.SourceContext.ShouldBe("TestComponent");
		capturedLog.RequestPath.ShouldBe("/api/test");
		capturedLog.RequestMethod.ShouldBe("POST");
		capturedLog.StatusCode.ShouldBe(500);
		capturedLog.CorrelationId.ShouldBe("corr-123");
		capturedLog.MachineName.ShouldBe("Browser");
		capturedLog.Environment.ShouldBe("Client");

		// Properties should contain serialized context
		capturedLog.Properties.ShouldNotBeNullOrWhiteSpace();
		capturedLog.Properties.ShouldContain("TestBrowser/1.0");
		capturedLog.Properties.ShouldContain("extra info");
	}

	/// <summary>
	/// Tests that repository.CreateAsync is called exactly once.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ValidRequest_CallsRepositoryOnceAsync()
	{
		// Arrange
		CreateLogRequest request =
			new()
			{
				LogLevel = "Information",
				Message = "Test message",
			};

		Repository
			.CreateAsync(
				Arg.Any<Log>(),
				Arg.Any<CancellationToken>())
			.Returns(
				callInfo => Task.FromResult(callInfo.Arg<Log>()));

		// Act
		await CreateClientLogCommandHandler.HandleAsync(
			request,
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
	/// Tests that cancellation token is passed to repository.
	/// </summary>
	[Fact]
	public async Task HandleAsync_PassesCancellationTokenAsync()
	{
		// Arrange
		CreateLogRequest request =
			new()
			{
				LogLevel = "Debug",
				Message = "Test",
			};

		using CancellationTokenSource cts =
			new();

		Repository
			.CreateAsync(
				Arg.Any<Log>(),
				Arg.Any<CancellationToken>())
			.Returns(
				callInfo => Task.FromResult(callInfo.Arg<Log>()));

		// Act
		await CreateClientLogCommandHandler.HandleAsync(
			request,
			Repository,
			cts.Token);

		// Assert
		await Repository
			.Received(1)
			.CreateAsync(
				Arg.Any<Log>(),
				cts.Token);
	}
}
