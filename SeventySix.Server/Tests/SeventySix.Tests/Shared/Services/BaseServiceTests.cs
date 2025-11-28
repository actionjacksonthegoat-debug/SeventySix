using Microsoft.Extensions.Logging;
using NSubstitute;
using SeventySix.Shared.Services;
using Xunit;

namespace SeventySix.Tests.Shared.Services;

public sealed class BaseServiceTests
{
	private readonly ILogger<TestService> Logger;
	private readonly TestService Service;

	public BaseServiceTests()
	{
		Logger = Substitute.For<ILogger<TestService>>();
		Service = new TestService(Logger);
	}

	[Fact]
	public async Task ExecuteWithLoggingAsync_SuccessfulOperation_ReturnsResultAsync()
	{
		// Arrange
		int expectedResult = 42;

		// Act
		int result = await Service.TestExecuteWithLoggingAsync(
			async () => await Task.FromResult(expectedResult),
			"TestOperation"
		);

		// Assert
		Assert.Equal(expectedResult, result);
		Logger.Received().Log(
			LogLevel.Information,
			Arg.Any<EventId>(),
			Arg.Is<object>(o => o.ToString()!.Contains("Starting TestOperation")),
			null,
			Arg.Any<Func<object, Exception?, string>>());
		Logger.Received().Log(
			LogLevel.Information,
			Arg.Any<EventId>(),
			Arg.Is<object>(o => o.ToString()!.Contains("Completed TestOperation")),
			null,
			Arg.Any<Func<object, Exception?, string>>());
	}

	[Fact]
	public async Task ExecuteWithLoggingAsync_ThrowsException_LogsErrorAsync()
	{
		// Arrange
		Exception expectedException = new InvalidOperationException("Test error");

		// Act & Assert
		Exception exception = await Assert.ThrowsAsync<InvalidOperationException>(
			async () => await Service.TestExecuteWithLoggingAsync<int>(
				() => throw expectedException,
				"FailingOperation"
			)
		);

		Assert.Same(expectedException, exception);
		Logger.Received().Log(
			LogLevel.Error,
			Arg.Any<EventId>(),
			Arg.Is<object>(o => o.ToString()!.Contains("Error in FailingOperation")),
			expectedException,
			Arg.Any<Func<object, Exception?, string>>());
	}

	[Fact]
	public async Task ExecuteWithLoggingAsync_LongRunningOperation_LogsTimingAsync()
	{
		// Arrange
		int delayMilliseconds = 100;

		// Act
		await Service.TestExecuteWithLoggingAsync(
			async () =>
			{
				await Task.Delay(delayMilliseconds);
				return 1;
			},
			"LongOperation"
		);

		// Assert
		Logger.Received().Log(
			LogLevel.Information,
			Arg.Any<EventId>(),
			Arg.Is<object>(o => o.ToString()!.Contains("Completed LongOperation")),
			null,
			Arg.Any<Func<object, Exception?, string>>());
	}

	[Fact]
	public async Task ValidateAsync_ValidInput_DoesNotThrowAsync()
	{
		// Arrange
		string validInput = "valid";

		// Act & Assert
		Exception? exception = await Record.ExceptionAsync(
			async () => await Service.TestValidateAsync(validInput, nameof(validInput))
		);

		Assert.Null(exception);
	}

	[Fact]
	public async Task ValidateAsync_NullInput_ThrowsArgumentNullExceptionAsync()
	{
		// Arrange
		string? nullInput = null;

		// Act & Assert
		await Assert.ThrowsAsync<ArgumentNullException>(
			async () => await Service.TestValidateAsync(nullInput, nameof(nullInput))
		);
	}

	[Fact]
	public async Task ValidateAsync_EmptyInput_ThrowsArgumentExceptionAsync()
	{
		// Arrange
		string emptyInput = string.Empty;

		// Act & Assert
		await Assert.ThrowsAsync<ArgumentException>(
			async () => await Service.TestValidateAsync(emptyInput, nameof(emptyInput))
		);
	}

	[Fact]
	public async Task ValidateAsync_WhitespaceInput_ThrowsArgumentExceptionAsync()
	{
		// Arrange
		string whitespaceInput = "   ";

		// Act & Assert
		await Assert.ThrowsAsync<ArgumentException>(
			async () => await Service.TestValidateAsync(whitespaceInput, nameof(whitespaceInput))
		);
	}
}

public sealed class TestService(ILogger<TestService> logger) : BaseService(logger)
{
	public async Task<T> TestExecuteWithLoggingAsync<T>(Func<Task<T>> operation, string operationName)
	{
		return await ExecuteWithLoggingAsync(operation, operationName);
	}

	public async Task TestValidateAsync(string? value, string parameterName)
	{
		await Task.CompletedTask;
		ValidateNotNullOrEmpty(value, parameterName);
	}
}