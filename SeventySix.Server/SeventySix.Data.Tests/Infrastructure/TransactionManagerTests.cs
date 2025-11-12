// <copyright file="TransactionManagerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using SeventySix.Core.Entities;
using SeventySix.Data;
using SeventySix.Data.Infrastructure;

namespace SeventySix.Data.Tests.Infrastructure;

/// <summary>
/// Unit tests for <see cref="Data.Infrastructure.TransactionManager"/>.
/// Tests transaction management, retry logic, and error handling.
/// </summary>
public class TransactionManagerTests : IDisposable
{
	private readonly ApplicationDbContext DbContext;
	private readonly Mock<ILogger<TransactionManager>> MockLogger;
	private readonly TransactionManager TransactionManager;

	public TransactionManagerTests()
	{
		// Use in-memory SQLite database for fast unit tests
		var options = new DbContextOptionsBuilder<ApplicationDbContext>()
			.UseSqlite("DataSource=:memory:")
			.Options;

		DbContext = new ApplicationDbContext(options);
		DbContext.Database.OpenConnection();
		DbContext.Database.EnsureCreated();

		MockLogger = new Mock<ILogger<TransactionManager>>();
		TransactionManager = new TransactionManager(DbContext, MockLogger.Object);
	}

	public void Dispose()
	{
		DbContext.Database.CloseConnection();
		DbContext.Dispose();
	}

	[Fact]
	public async Task ExecuteInTransactionAsync_WithSuccessfulOperation_CommitsTransactionAsync()
	{
		// Arrange
		var entity = new ThirdPartyApiRequest
		{
			ApiName = "TestApi",
			BaseUrl = "https://test.api",
			ResetDate = DateOnly.FromDateTime(DateTime.UtcNow),
			CallCount = 1,
			CreatedAt = DateTime.UtcNow,
			UpdatedAt = DateTime.UtcNow
		};

		// Act
		var result = await TransactionManager.ExecuteInTransactionAsync(async cancellationToken =>
		{
			DbContext.ThirdPartyApiRequests.Add(entity);
			await DbContext.SaveChangesAsync(cancellationToken);
			return entity.Id;
		});

		// Assert
		result.Should().BeGreaterThan(0);
		var savedEntity = await DbContext.ThirdPartyApiRequests.FindAsync(result);
		savedEntity.Should().NotBeNull();
		savedEntity!.ApiName.Should().Be("TestApi");
	}

	[Fact]
	public async Task ExecuteInTransactionAsync_WithException_RollsBackTransactionAsync()
	{
		// Arrange
		var entity = new ThirdPartyApiRequest
		{
			ApiName = "TestApi",
			BaseUrl = "https://test.api",
			ResetDate = DateOnly.FromDateTime(DateTime.UtcNow),
			CallCount = 1,
			CreatedAt = DateTime.UtcNow,
			UpdatedAt = DateTime.UtcNow
		};

		// Act
		var act = async () => await TransactionManager.ExecuteInTransactionAsync(async cancellationToken =>
		{
			DbContext.ThirdPartyApiRequests.Add(entity);
			await DbContext.SaveChangesAsync(cancellationToken);
			throw new InvalidOperationException("Simulated error");
		});

		// Assert
		await act.Should().ThrowAsync<InvalidOperationException>()
			.WithMessage("Simulated error");

		var allEntities = await DbContext.ThirdPartyApiRequests.ToListAsync();
		allEntities.Should().BeEmpty(); // Transaction was rolled back
	}

	[Fact]
	public async Task ExecuteInTransactionAsync_WithNullOperation_ThrowsArgumentNullExceptionAsync()
	{
		// Act
		var act = async () => await TransactionManager.ExecuteInTransactionAsync<int>(null!);

		// Assert
		await act.Should().ThrowAsync<ArgumentNullException>();
	}

	[Fact]
	public async Task ExecuteInTransactionAsync_VoidOverload_ExecutesSuccessfullyAsync()
	{
		// Arrange
		var entity = new ThirdPartyApiRequest
		{
			ApiName = "TestApi",
			BaseUrl = "https://test.api",
			ResetDate = DateOnly.FromDateTime(DateTime.UtcNow),
			CallCount = 1,
			CreatedAt = DateTime.UtcNow,
			UpdatedAt = DateTime.UtcNow
		};

		// Act
		await TransactionManager.ExecuteInTransactionAsync(async cancellationToken =>
		{
			DbContext.ThirdPartyApiRequests.Add(entity);
			await DbContext.SaveChangesAsync(cancellationToken);
		});

		// Assert
		var allEntities = await DbContext.ThirdPartyApiRequests.ToListAsync();
		allEntities.Should().HaveCount(1);
		allEntities[0].ApiName.Should().Be("TestApi");
	}

	[Fact]
	public async Task ExecuteInTransactionAsync_WithConcurrencyException_RetriesOperationAsync()
	{
		// Arrange
		var entity = new ThirdPartyApiRequest
		{
			ApiName = "TestApi",
			BaseUrl = "https://test.api",
			ResetDate = DateOnly.FromDateTime(DateTime.UtcNow),
			CallCount = 1,
			CreatedAt = DateTime.UtcNow,
			UpdatedAt = DateTime.UtcNow
		};

		DbContext.ThirdPartyApiRequests.Add(entity);
		await DbContext.SaveChangesAsync();

		var attemptCount = 0;

		// Act
		var result = await TransactionManager.ExecuteInTransactionAsync(async cancellationToken =>
		{
			attemptCount++;
			var trackedEntity = await DbContext.ThirdPartyApiRequests.FindAsync(new object[] { entity.Id }, cancellationToken);

			if (attemptCount == 1)
			{
				// Simulate concurrency conflict on first attempt by detaching and modifying
				DbContext.Entry(trackedEntity!).State = EntityState.Detached;
				throw new DbUpdateConcurrencyException("Simulated concurrency conflict");
			}

			// Succeed on retry
			trackedEntity!.CallCount = 50;
			await DbContext.SaveChangesAsync(cancellationToken);

			return trackedEntity.CallCount;
		}, maxRetries: 3);

		// Assert
		result.Should().Be(50);
		attemptCount.Should().Be(2); // First attempt failed, second succeeded
	}

	[Fact]
	public async Task ExecuteInTransactionAsync_WithMaxRetriesExceeded_ThrowsInvalidOperationExceptionAsync()
	{
		// Arrange
		var attemptCount = 0;

		// Act
		var act = async () => await TransactionManager.ExecuteInTransactionAsync(async cancellationToken =>
		{
			attemptCount++;
			// Always throw concurrency exception
			throw new DbUpdateConcurrencyException("Simulated concurrency conflict");
		}, maxRetries: 2);

		// Assert
		await act.Should().ThrowAsync<InvalidOperationException>()
			.WithMessage("*failed after 2 retries*");

		attemptCount.Should().Be(3); // Initial attempt + 2 retries
	}

	[Fact]
	public async Task ExecuteInTransactionAsync_WithNonRetryableException_DoesNotRetryAsync()
	{
		// Arrange
		var attemptCount = 0;

		// Act
		var act = async () => await TransactionManager.ExecuteInTransactionAsync(async cancellationToken =>
		{
			attemptCount++;
			throw new InvalidOperationException("Non-retryable error");
		}, maxRetries: 3);

		// Assert
		await act.Should().ThrowAsync<InvalidOperationException>()
			.WithMessage("Non-retryable error");

		attemptCount.Should().Be(1); // No retries for non-retryable exceptions
	}

	[Fact]
	public async Task ExecuteInTransactionAsync_WithCancellation_ThrowsOperationCanceledExceptionAsync()
	{
		// Arrange
		var cancellationTokenSource = new CancellationTokenSource();
		cancellationTokenSource.Cancel();

		// Act
		var act = async () => await TransactionManager.ExecuteInTransactionAsync(
			async cancellationToken =>
			{
				cancellationToken.ThrowIfCancellationRequested();
				await Task.Delay(100, cancellationToken);
				return 42;
			},
			cancellationToken: cancellationTokenSource.Token);

		// Assert
		await act.Should().ThrowAsync<OperationCanceledException>();
	}

	[Fact]
	public void Constructor_WithNullContext_ThrowsArgumentNullException()
	{
		// Act
		var act = () => new TransactionManager(null!, MockLogger.Object);

		// Assert
		act.Should().Throw<ArgumentNullException>()
			.WithParameterName("context");
	}

	[Fact]
	public void Constructor_WithNullLogger_ThrowsArgumentNullException()
	{
		// Act
		var act = () => new TransactionManager(DbContext, null!);

		// Assert
		act.Should().Throw<ArgumentNullException>()
			.WithParameterName("logger");
	}

	[Fact]
	public async Task ExecuteInTransactionAsync_WithRetries_LogsWarningsAsync()
	{
		// Arrange
		var attemptCount = 0;

		// Act
		await TransactionManager.ExecuteInTransactionAsync(async cancellationToken =>
		{
			attemptCount++;
			if (attemptCount == 1)
			{
				throw new DbUpdateConcurrencyException("Simulated concurrency conflict");
			}

			return 42;
		}, maxRetries: 2);

		// Assert
		MockLogger.Verify(
			x => x.Log(
				LogLevel.Warning,
				It.IsAny<EventId>(),
				It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Concurrency conflict detected")),
				It.IsAny<DbUpdateConcurrencyException>(),
				It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
			Times.Once);
	}

	[Fact]
	public async Task ExecuteInTransactionAsync_WithSuccessAfterRetry_LogsSuccessAsync()
	{
		// Arrange
		var attemptCount = 0;

		// Act
		await TransactionManager.ExecuteInTransactionAsync(async cancellationToken =>
		{
			attemptCount++;
			if (attemptCount == 1)
			{
				throw new DbUpdateConcurrencyException("Simulated concurrency conflict");
			}

			return 42;
		}, maxRetries: 2);

		// Assert
		MockLogger.Verify(
			x => x.Log(
				LogLevel.Information,
				It.IsAny<EventId>(),
				It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Transaction succeeded after")),
				It.IsAny<Exception>(),
				It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
			Times.Once);
	}

	[Fact]
	public async Task ExecuteInTransactionAsync_MultipleOperations_IsolatesTransactionsAsync()
	{
		// Arrange & Act
		var result1 = await TransactionManager.ExecuteInTransactionAsync(async cancellationToken =>
		{
			var entity = new ThirdPartyApiRequest
			{
				ApiName = "Api1",
				BaseUrl = "https://api1.com",
				ResetDate = DateOnly.FromDateTime(DateTime.UtcNow),
				CallCount = 1,
				CreatedAt = DateTime.UtcNow,
				UpdatedAt = DateTime.UtcNow
			};
			DbContext.ThirdPartyApiRequests.Add(entity);
			await DbContext.SaveChangesAsync(cancellationToken);
			return entity.Id;
		});

		var result2 = await TransactionManager.ExecuteInTransactionAsync(async cancellationToken =>
		{
			var entity = new ThirdPartyApiRequest
			{
				ApiName = "Api2",
				BaseUrl = "https://api2.com",
				ResetDate = DateOnly.FromDateTime(DateTime.UtcNow),
				CallCount = 1,
				CreatedAt = DateTime.UtcNow,
				UpdatedAt = DateTime.UtcNow
			};
			DbContext.ThirdPartyApiRequests.Add(entity);
			await DbContext.SaveChangesAsync(cancellationToken);
			return entity.Id;
		});

		// Assert
		result1.Should().NotBe(result2);
		var allEntities = await DbContext.ThirdPartyApiRequests.ToListAsync();
		allEntities.Should().HaveCount(2);
		allEntities.Should().Contain(e => e.ApiName == "Api1");
		allEntities.Should().Contain(e => e.ApiName == "Api2");
	}
}
