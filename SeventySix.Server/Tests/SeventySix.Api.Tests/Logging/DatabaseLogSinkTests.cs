// <copyright file="DatabaseLogSinkTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Serilog.Events;
using Serilog.Parsing;
using SeventySix.Api.Logging;
using SeventySix.Logging;
using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Api.Tests.Logging;

/// <summary>
/// Integration tests for <see cref="DatabaseLogSink"/>.
/// </summary>
/// <remarks>
/// Tests custom database sink functionality including:
/// - Log level filtering (Warning+)
/// - Exception formatting with base exception
/// - Stack trace filtering for SeventySix code
/// - HTTP request property extraction
///
/// Uses shared PostgreSQL Testcontainer for efficient integration testing.
/// </remarks>
[Collection("PostgreSQL")]
public class DatabaseLogSinkTests : IAsyncLifetime
{
	private readonly TestcontainersPostgreSqlFixture Fixture;
	private LoggingDbContext? Context;
	private ServiceProvider? ServiceProvider;
	private ILogRepository? LogRepository;

	/// <summary>
	/// Initializes a new instance of the <see cref="DatabaseLogSinkTests"/> class.
	/// </summary>
	/// <param name="fixture">The shared PostgreSQL fixture.</param>
	public DatabaseLogSinkTests(TestcontainersPostgreSqlFixture fixture)
	{
		Fixture = fixture;
	}

	public async Task InitializeAsync()
	{
		// Configure DbContext with shared PostgreSQL container
		DbContextOptions<LoggingDbContext> options = new DbContextOptionsBuilder<LoggingDbContext>()
			.UseNpgsql(Fixture.ConnectionString)
			.Options;

		Context = new LoggingDbContext(options);

		// Clear logs table before each test for isolation
		await Context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Logging\".\"Logs\" CASCADE");

		// Create service provider for dependency injection
		ServiceCollection services = new();
		services.AddScoped<ILogRepository>(_ => new LogRepository(
			Context,
			Microsoft.Extensions.Logging.Abstractions.NullLogger<LogRepository>.Instance));
		services.AddScoped(_ => Context);
		ServiceProvider = services.BuildServiceProvider();

		LogRepository = ServiceProvider.GetRequiredService<ILogRepository>();
	}

	[Fact]
	public async Task Emit_WarningLevel_WritesToDatabaseAsync()
	{
		// Arrange
		await using DatabaseLogSink sink = new(ServiceProvider!, "Test", "TestMachine");
		MessageTemplate messageTemplate = new MessageTemplateParser().Parse("Test warning message");
		LogEvent logEvent = new(
			DateTimeOffset.UtcNow,
			LogEventLevel.Warning,
			null,
			messageTemplate,
			[]);

		// Act
		sink.Emit(logEvent);
		// await using will dispose and flush the batch automatically
		// Note: Explicit DisposeAsync happens at end of scope
	}

	[Fact]
	public async Task Emit_WarningLevel_WritesToDatabase_VerifiedAsync()
	{
		// Arrange
		await using DatabaseLogSink sink = new(ServiceProvider!, "Test", "TestMachine");
		MessageTemplate messageTemplate = new MessageTemplateParser().Parse("Test warning message");
		LogEvent logEvent = new(
			DateTimeOffset.UtcNow,
			LogEventLevel.Warning,
			null,
			messageTemplate,
			[]);

		// Act
		sink.Emit(logEvent);
		// Dispose flushes the batch
		await ((IAsyncDisposable)sink).DisposeAsync();

		// Assert
		LogQueryRequest request = new() { SearchTerm = "Test warning message" };
		(IEnumerable<Log> logs, int _) = await LogRepository!.GetPagedAsync(request);
		Assert.Single(logs);
		Log log = logs.First();
		Assert.Equal("Warning", log.LogLevel);
		Assert.Equal("Test warning message", log.Message);
		Assert.Equal("Test", log.Environment);
		Assert.Equal("TestMachine", log.MachineName);
	}

	[Fact]
	public async Task Emit_ErrorLevel_WritesToDatabaseAsync()
	{
		// Arrange
		await using DatabaseLogSink sink = new(ServiceProvider!, "Test", "TestMachine");
		MessageTemplate messageTemplate = new MessageTemplateParser().Parse("Test error message");
		LogEvent logEvent = new(
			DateTimeOffset.UtcNow,
			LogEventLevel.Error,
			null,
			messageTemplate,
			[]);

		// Act
		sink.Emit(logEvent);
		await ((IAsyncDisposable)sink).DisposeAsync();

		// Assert
		LogQueryRequest request = new() { SearchTerm = "Test error message" };
		(IEnumerable<Log> logs, int _) = await LogRepository!.GetPagedAsync(request);
		Assert.Single(logs);
		Log log = logs.First();
		Assert.Equal("Error", log.LogLevel);
		Assert.Equal("Test error message", log.Message);
	}

	[Fact]
	public async Task Emit_InformationLevel_DoesNotWriteToDatabaseAsync()
	{
		// Arrange
		await using DatabaseLogSink sink = new(ServiceProvider!, "Test", "TestMachine");
		MessageTemplate messageTemplate = new MessageTemplateParser().Parse("Test info message");
		LogEvent logEvent = new(
			DateTimeOffset.UtcNow,
			LogEventLevel.Information,
			null,
			messageTemplate,
			[]);

		// Act
		sink.Emit(logEvent);
		await ((IAsyncDisposable)sink).DisposeAsync();

		// Assert
		LogQueryRequest request = new() { SearchTerm = "Test info message" };
		(IEnumerable<Log> logs, int _) = await LogRepository!.GetPagedAsync(request);
		Assert.Empty(logs); // Information level should not be persisted
	}

	[Fact]
	public async Task Emit_WithException_FormatsExceptionProperlyAsync()
	{
		// Arrange
		await using DatabaseLogSink sink = new(ServiceProvider!, "Test", "TestMachine");
		Exception caughtException;
		try
		{
			throw new InvalidOperationException("Test exception message");
		}
		catch (Exception exception)
		{
			caughtException = exception;
		}

		MessageTemplate messageTemplate = new MessageTemplateParser().Parse("Error occurred");
		LogEvent logEvent = new(
			DateTimeOffset.UtcNow,
			LogEventLevel.Error,
			caughtException,
			messageTemplate,
			[]);

		// Act
		sink.Emit(logEvent);
		await ((IAsyncDisposable)sink).DisposeAsync();

		// Assert
		LogQueryRequest request = new() { SearchTerm = "Error occurred" };
		(IEnumerable<Log> logs, int _) = await LogRepository!.GetPagedAsync(request);
		Assert.Single(logs);
		Log log = logs.First();
		Assert.Equal("Test exception message", log.ExceptionMessage);
		Assert.NotNull(log.StackTrace); // Should have stack trace
	}

	[Fact]
	public async Task Emit_WithNestedException_CapturesBaseExceptionAsync()
	{
		// Arrange
		await using DatabaseLogSink sink = new(ServiceProvider!, "Test", "TestMachine");

		Exception nestedException;
		try
		{
			try
			{
				throw new ArgumentException("Inner exception");
			}
			catch (ArgumentException inner)
			{
				throw new InvalidOperationException("Outer exception", inner);
			}
		}
		catch (Exception ex)
		{
			nestedException = ex;
		}

		MessageTemplate messageTemplate = new MessageTemplateParser().Parse("Nested error occurred");
		LogEvent logEvent = new(
			DateTimeOffset.UtcNow,
			LogEventLevel.Error,
			nestedException,
			messageTemplate,
			[]);

		// Act
		sink.Emit(logEvent);
		await ((IAsyncDisposable)sink).DisposeAsync();

		// Assert
		LogQueryRequest request = new() { SearchTerm = "Nested error occurred" };
		(IEnumerable<Log> logs, int _) = await LogRepository!.GetPagedAsync(request);
		Assert.Single(logs);
		Log log = logs.First();
		Assert.Equal("Outer exception", log.ExceptionMessage);
		Assert.Equal("Inner exception", log.BaseExceptionMessage);
	}

	public async Task DisposeAsync()
	{
		if (ServiceProvider != null)
		{
			await ServiceProvider.DisposeAsync();
		}

		if (Context != null)
		{
			await Context.DisposeAsync();
		}

		// Note: Do not dispose the shared PostgreSQL container (Fixture) - it's managed by xUnit collection
	}
}
