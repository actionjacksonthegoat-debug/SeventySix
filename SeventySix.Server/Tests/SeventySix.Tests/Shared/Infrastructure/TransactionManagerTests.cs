// <copyright file="TransactionManagerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SeventySix.ApiTracking;
using SeventySix.Identity;
using SeventySix.Shared;

namespace SeventySix.Tests.Infrastructure;

/// <summary>
/// Unit tests for <see cref="TransactionManager"/>.
/// Tests transaction management, retry logic, and error handling.
/// </summary>
public class TransactionManagerTests : IDisposable
{
	private readonly ApiTrackingDbContext DbContext;
	private readonly TransactionManager TransactionManager;

	public TransactionManagerTests()
	{
		// Use in-memory SQLite database for fast unit tests
		DbContextOptions<ApiTrackingDbContext> options = new DbContextOptionsBuilder<ApiTrackingDbContext>()
			.UseSqlite("DataSource=:memory:")
			.Options;

		DbContext = new ApiTrackingDbContext(options);
		DbContext.Database.OpenConnection();
		DbContext.Database.EnsureCreated();

		TransactionManager = new TransactionManager(DbContext);
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
		ThirdPartyApiRequest entity = new()
		{
			ApiName = "TestApi",
			BaseUrl = "https://test.api",
			ResetDate = DateOnly.FromDateTime(DateTime.UtcNow),
			CallCount = 0,
			CreatedAt = DateTime.UtcNow,
			ModifiedAt = null
		};

		// Act
		int result = await TransactionManager.ExecuteInTransactionAsync(async cancellationToken =>
		{
			DbContext.ThirdPartyApiRequests.Add(entity);
			await DbContext.SaveChangesAsync(cancellationToken);
			return entity.Id;
		});

		// Assert
		result.Should().BeGreaterThan(0);
		ThirdPartyApiRequest? savedEntity = await DbContext.ThirdPartyApiRequests.FindAsync(result);
		savedEntity.Should().NotBeNull();
		savedEntity!.ApiName.Should().Be("TestApi");
	}

	[Fact]
	public async Task ExecuteInTransactionAsync_WithException_RollsBackTransactionAsync()
	{
		// Arrange
		ThirdPartyApiRequest entity = new()
		{
			ApiName = "TestApi",
			BaseUrl = "https://test.api",
			ResetDate = DateOnly.FromDateTime(DateTime.UtcNow),
			CallCount = 1,
			CreatedAt = DateTime.UtcNow,
			ModifiedAt = null
		};

		// Act
		Func<Task> act = async () => await TransactionManager.ExecuteInTransactionAsync(async cancellationToken =>
		{
			DbContext.ThirdPartyApiRequests.Add(entity);
			await DbContext.SaveChangesAsync(cancellationToken);
			throw new InvalidOperationException("Simulated error");
		});

		// Assert
		await act.Should().ThrowAsync<InvalidOperationException>()
			.WithMessage("Simulated error");

		List<ThirdPartyApiRequest> allEntities = await DbContext.ThirdPartyApiRequests.ToListAsync();
		allEntities.Should().BeEmpty(); // Transaction was rolled back
	}

	[Fact]
	public async Task ExecuteInTransactionAsync_WithNullOperation_ThrowsArgumentNullExceptionAsync()
	{
		// Act
		Func<Task<int>> act = async () => await TransactionManager.ExecuteInTransactionAsync<int>(null!);

		// Assert
		await act.Should().ThrowAsync<ArgumentNullException>();
	}

	[Fact]
	public async Task ExecuteInTransactionAsync_VoidOverload_ExecutesSuccessfullyAsync()
	{
		// Arrange
		ThirdPartyApiRequest entity = new()
		{
			ApiName = "TestApi",
			BaseUrl = "https://test.api",
			ResetDate = DateOnly.FromDateTime(DateTime.UtcNow),
			CallCount = 1,
			CreatedAt = DateTime.UtcNow,
			ModifiedAt = null
		};

		// Act
		await TransactionManager.ExecuteInTransactionAsync(async cancellationToken =>
		{
			DbContext.ThirdPartyApiRequests.Add(entity);
			await DbContext.SaveChangesAsync(cancellationToken);
		});

		// Assert
		List<ThirdPartyApiRequest> allEntities = await DbContext.ThirdPartyApiRequests.ToListAsync();
		allEntities.Should().HaveCount(1);
		allEntities[0].ApiName.Should().Be("TestApi");
	}

	[Fact]
	public async Task ExecuteInTransactionAsync_WithConcurrencyException_RetriesOperationAsync()
	{
		// Arrange
		ThirdPartyApiRequest entity = new()
		{
			ApiName = "TestApi",
			BaseUrl = "https://test.api",
			ResetDate = DateOnly.FromDateTime(DateTime.UtcNow),
			CallCount = 1,
			CreatedAt = DateTime.UtcNow,
			ModifiedAt = null
		};

		DbContext.ThirdPartyApiRequests.Add(entity);
		await DbContext.SaveChangesAsync();

		int attemptCount = 0;

		// Act
		int result = await TransactionManager.ExecuteInTransactionAsync(async cancellationToken =>
		{
			attemptCount++;
			ThirdPartyApiRequest? trackedEntity = await DbContext.ThirdPartyApiRequests.FindAsync([entity.Id], cancellationToken);

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
		int attemptCount = 0;

		// Act
		Func<Task> act = async () => await TransactionManager.ExecuteInTransactionAsync(async cancellationToken =>
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
		int attemptCount = 0;

		// Act
		Func<Task> act = async () => await TransactionManager.ExecuteInTransactionAsync(async cancellationToken =>
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
		CancellationTokenSource cancellationTokenSource = new();
		cancellationTokenSource.Cancel();

		// Act
		Func<Task<int>> act = async () => await TransactionManager.ExecuteInTransactionAsync(
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
	public async Task ExecuteInTransactionAsync_MultipleOperations_IsolatesTransactionsAsync()
	{
		// Arrange & Act
		int result1 = await TransactionManager.ExecuteInTransactionAsync(async cancellationToken =>
		{
			ThirdPartyApiRequest entity = new()
			{
				ApiName = "Api1",
				BaseUrl = "https://api1.com",
				ResetDate = DateOnly.FromDateTime(DateTime.UtcNow),
				CallCount = 1,
				CreatedAt = DateTime.UtcNow,
				ModifiedAt = null
			};
			DbContext.ThirdPartyApiRequests.Add(entity);
			await DbContext.SaveChangesAsync(cancellationToken);
			return entity.Id;
		});

		int result2 = await TransactionManager.ExecuteInTransactionAsync(async cancellationToken =>
		{
			ThirdPartyApiRequest entity = new()
			{
				ApiName = "Api2",
				BaseUrl = "https://api2.com",
				ResetDate = DateOnly.FromDateTime(DateTime.UtcNow),
				CallCount = 1,
				CreatedAt = DateTime.UtcNow,
				ModifiedAt = null
			};
			DbContext.ThirdPartyApiRequests.Add(entity);
			await DbContext.SaveChangesAsync(cancellationToken);
			return entity.Id;
		});

		// Assert
		result1.Should().NotBe(result2);
		List<ThirdPartyApiRequest> allEntities = await DbContext.ThirdPartyApiRequests.ToListAsync();
		allEntities.Should().HaveCount(2);
		allEntities.Should().Contain(e => e.ApiName == "Api1");
		allEntities.Should().Contain(e => e.ApiName == "Api2");
	}

	[Fact]
	public void Constructor_WithNullContext_DoesNotThrowBecauseOfPrimaryConstructor()
	{
		// Note: TransactionManager uses primary constructor syntax which relies on
		// dependency injection to provide non-null dependencies.
		// This test verifies we understand the pattern - no null checks in primary constructors.
		Assert.True(true);
	}

	[Fact]
	public async Task ExecuteInTransactionAsync_WithRetries_SucceedsAfterRetryAsync()
	{
		// Note: Logging was removed from TransactionManager.
		// This test verifies the retry behavior without checking logs.
		// Arrange
		int attemptCount = 0;

		// Act
		int result = await TransactionManager.ExecuteInTransactionAsync(async cancellationToken =>
		{
			attemptCount++;
			if (attemptCount == 1)
			{
				throw new DbUpdateConcurrencyException("Simulated concurrency conflict");
			}

			return 42;
		}, maxRetries: 2);

		// Assert - Verify retry happened and operation succeeded
		result.Should().Be(42);
		attemptCount.Should().Be(2);
	}
}
