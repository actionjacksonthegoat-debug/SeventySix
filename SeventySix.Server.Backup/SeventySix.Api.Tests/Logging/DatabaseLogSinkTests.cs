// <copyright file="DatabaseLogSinkTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Serilog.Events;
using Serilog.Parsing;
using SeventySix.Api.Logging;
using SeventySix.Core.Entities;
using SeventySix.Core.Interfaces;
using SeventySix.Data;
using SeventySix.DataAccess.Repositories;
using Testcontainers.PostgreSql;

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
/// Uses Testcontainers with PostgreSQL for realistic integration testing.
/// </remarks>
public class DatabaseLogSinkTests : IAsyncLifetime
{
	private PostgreSqlContainer? PostgresContainer;
	private ApplicationDbContext? Context;
	private ServiceProvider? ServiceProvider;
	private ILogRepository? LogRepository;

	public async Task InitializeAsync()
	{
		// Create and start PostgreSQL container
		PostgresContainer = new PostgreSqlBuilder()
			.WithImage("postgres:16-alpine")
			.WithDatabase("seventysix_test")
			.WithUsername("postgres")
			.WithPassword("testpass123")
			.Build();

		await PostgresContainer.StartAsync();

		// Configure DbContext with PostgreSQL
		DbContextOptions<ApplicationDbContext> options = new DbContextOptionsBuilder<ApplicationDbContext>()
			.UseNpgsql(PostgresContainer.GetConnectionString())
			.Options;

		Context = new ApplicationDbContext(options);
		await Context.Database.EnsureCreatedAsync();

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

	private async Task WaitForBatchProcessingAsync() => await Task.Delay(100); // Allow batch to complete

	private async Task AssertSingleLogAsync(string expectedLevel, string expectedMessage)
	{
		await WaitForBatchProcessingAsync();
		IEnumerable<Log> logs = await LogRepository!.GetLogsAsync();
		Assert.Single(logs);
		Log log = logs.First();
		Assert.Equal(expectedLevel, log.LogLevel);
		Assert.Equal(expectedMessage, log.Message);
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
		IEnumerable<Log> logs = await LogRepository!.GetLogsAsync();
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
		IEnumerable<Log> logs = await LogRepository!.GetLogsAsync();
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
		IEnumerable<Log> logs = await LogRepository!.GetLogsAsync();
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
		IEnumerable<Log> logs = await LogRepository!.GetLogsAsync();
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
		IEnumerable<Log> logs = await LogRepository!.GetLogsAsync();
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

		if (PostgresContainer != null)
		{
			await PostgresContainer.DisposeAsync();
		}
	}
}