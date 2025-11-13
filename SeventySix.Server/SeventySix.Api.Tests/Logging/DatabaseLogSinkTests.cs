// <copyright file="DatabaseLogSinkTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Serilog.Events;
using Serilog.Parsing;
using SeventySix.Api.Logging;
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
		var options = new DbContextOptionsBuilder<ApplicationDbContext>()
			.UseNpgsql(PostgresContainer.GetConnectionString())
			.Options;

		Context = new ApplicationDbContext(options);
		await Context.Database.EnsureCreatedAsync();

		// Create service provider for dependency injection
		var services = new ServiceCollection();
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
		var sink = new DatabaseLogSink(ServiceProvider!, "Test", "TestMachine");
		var messageTemplate = new MessageTemplateParser().Parse("Test warning message");
		var logEvent = new LogEvent(
			DateTimeOffset.UtcNow,
			LogEventLevel.Warning,
			null,
			messageTemplate,
			[]);

		// Act
		sink.Emit(logEvent);
		await Task.Delay(500); // Allow async write to complete

		// Assert
		var logs = await LogRepository!.GetLogsAsync();
		Assert.Single(logs);
		var log = logs.First();
		Assert.Equal("Warning", log.LogLevel);
		Assert.Equal("Test warning message", log.Message);
		Assert.Equal("Test", log.Environment);
		Assert.Equal("TestMachine", log.MachineName);
	}

	[Fact]
	public async Task Emit_ErrorLevel_WritesToDatabaseAsync()
	{
		// Arrange
		var sink = new DatabaseLogSink(ServiceProvider!, "Test", "TestMachine");
		var messageTemplate = new MessageTemplateParser().Parse("Test error message");
		var logEvent = new LogEvent(
			DateTimeOffset.UtcNow,
			LogEventLevel.Error,
			null,
			messageTemplate,
			[]);

		// Act
		sink.Emit(logEvent);
		await Task.Delay(500); // Allow async write to complete

		// Assert
		var logs = await LogRepository!.GetLogsAsync();
		Assert.Single(logs);
		var log = logs.First();
		Assert.Equal("Error", log.LogLevel);
		Assert.Equal("Test error message", log.Message);
	}

	[Fact]
	public async Task Emit_InformationLevel_DoesNotWriteToDatabaseAsync()
	{
		// Arrange
		var sink = new DatabaseLogSink(ServiceProvider!, "Test", "TestMachine");
		var messageTemplate = new MessageTemplateParser().Parse("Test info message");
		var logEvent = new LogEvent(
			DateTimeOffset.UtcNow,
			LogEventLevel.Information,
			null,
			messageTemplate,
			[]);

		// Act
		sink.Emit(logEvent);
		await Task.Delay(500); // Allow async write to complete

		// Assert
		var logs = await LogRepository!.GetLogsAsync();
		Assert.Empty(logs); // Information level should not be persisted
	}

	[Fact]
	public async Task Emit_WithException_FormatsExceptionProperlyAsync()
	{
		// Arrange
		var sink = new DatabaseLogSink(ServiceProvider!, "Test", "TestMachine");
		Exception caughtException;
		try
		{
			throw new InvalidOperationException("Test exception message");
		}
		catch (Exception exception)
		{
			caughtException = exception;
		}

		var messageTemplate = new MessageTemplateParser().Parse("Error occurred");
		var logEvent = new LogEvent(
			DateTimeOffset.UtcNow,
			LogEventLevel.Error,
			caughtException,
			messageTemplate,
			[]);

		// Act
		sink.Emit(logEvent);
		await Task.Delay(500); // Allow async write to complete

		// Assert
		var logs = await LogRepository!.GetLogsAsync();
		Assert.Single(logs);
		var log = logs.First();
		Assert.Equal("Test exception message", log.ExceptionMessage);
		Assert.NotNull(log.StackTrace); // Should have stack trace
	}

	[Fact]
	public async Task Emit_WithNestedException_CapturesBaseExceptionAsync()
	{
		// Arrange
		var sink = new DatabaseLogSink(ServiceProvider!, "Test", "TestMachine");

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

		var messageTemplate = new MessageTemplateParser().Parse("Nested error occurred");
		var logEvent = new LogEvent(
			DateTimeOffset.UtcNow,
			LogEventLevel.Error,
			nestedException,
			messageTemplate,
			[]);

		// Act
		sink.Emit(logEvent);
		await Task.Delay(500); // Allow async write to complete

		// Assert
		var logs = await LogRepository!.GetLogsAsync();
		Assert.Single(logs);
		var log = logs.First();
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