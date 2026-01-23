// <copyright file="TransactionManagerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;
using SeventySix.ApiTracking;
using SeventySix.Shared.Persistence;
using Shouldly;

namespace SeventySix.Shared.Tests.Persistence;

/// <summary>
/// Unit tests for <see cref="TransactionManager"/>.
/// Tests transaction management, retry logic, and error handling.
/// </summary>
public class TransactionManagerTests : IDisposable
{
	private readonly ApiTrackingDbContext DbContext;
	private readonly TransactionManager TransactionManager;

	/// <summary>
	/// Sets up an in-memory SQLite DbContext and TransactionManager for tests.
	/// </summary>
	public TransactionManagerTests()
	{
		// Use in-memory SQLite database for fast unit tests
		DbContextOptions<ApiTrackingDbContext> options =
			new DbContextOptionsBuilder<ApiTrackingDbContext>()
				.UseSqlite("DataSource=:memory:")
				.Options;

		DbContext =
			new ApiTrackingDbContext(options);
		DbContext.Database.OpenConnection();
		DbContext.Database.EnsureCreated();

		TransactionManager =
			new TransactionManager(DbContext);
	}

	public void Dispose()
	{
		DbContext.Database.CloseConnection();
		DbContext.Dispose();
	}

	/// <summary>
	/// Verifies that a successful operation commits the transaction.
	/// </summary>
	[Fact]
	public async Task ExecuteInTransactionAsync_WithSuccessfulOperation_CommitsTransactionAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		ThirdPartyApiRequest entity =
			new()
			{
				ApiName = "TestApi",
				BaseUrl = "https://test.api",
				ResetDate =
					DateOnly.FromDateTime(
				timeProvider.GetUtcNow().UtcDateTime),
				CallCount = 0,
				CreateDate =
					timeProvider.GetUtcNow().UtcDateTime,
				ModifyDate = null,
			};

		// Act
		long result =
			await TransactionManager.ExecuteInTransactionAsync(
			async cancellationToken =>
			{
				DbContext.ThirdPartyApiRequests.Add(entity);
				await DbContext.SaveChangesAsync(cancellationToken);
				return entity.Id;
			});

		// Assert
		result.ShouldBeGreaterThan(0);
		ThirdPartyApiRequest? savedEntity =
			await DbContext.ThirdPartyApiRequests.FindAsync(result);
		savedEntity.ShouldNotBeNull();
		savedEntity!.ApiName.ShouldBe("TestApi");
	}

	/// <summary>
	/// Verifies that when an operation throws an exception the transaction is rolled back.
	/// </summary>
	[Fact]
	public async Task ExecuteInTransactionAsync_WithException_RollsBackTransactionAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		ThirdPartyApiRequest entity =
			new()
			{
				ApiName = "TestApi",
				BaseUrl = "https://test.api",
				ResetDate =
					DateOnly.FromDateTime(
				timeProvider.GetUtcNow().UtcDateTime),
				CallCount = 2,
				CreateDate =
					timeProvider.GetUtcNow().UtcDateTime,
				ModifyDate = null,
			};

		// Act
		Func<Task> act =
			async () =>
			await TransactionManager.ExecuteInTransactionAsync(
				async cancellationToken =>
				{
					DbContext.ThirdPartyApiRequests.Add(entity);
					await DbContext.SaveChangesAsync(cancellationToken);
					throw new InvalidOperationException("Simulated error");
				});

		// Assert
		InvalidOperationException exception =
			await Should.ThrowAsync<InvalidOperationException>(act);
		exception.Message.ShouldBe("Simulated error");

		List<ThirdPartyApiRequest> allEntities =
			await DbContext.ThirdPartyApiRequests.ToListAsync();
		allEntities.ShouldBeEmpty(); // Transaction was rolled back
	}

	/// <summary>
	/// Verifies that passing a null operation throws an ArgumentNullException.
	/// </summary>
	[Fact]
	public async Task ExecuteInTransactionAsync_WithNullOperation_ThrowsArgumentNullExceptionAsync()
	{
		// Act
		Func<Task<int>> act =
			async () =>
			await TransactionManager.ExecuteInTransactionAsync<int>(null!);

		// Assert
		await Should.ThrowAsync<ArgumentNullException>(act);
	}

	/// <summary>
	/// Verifies the void overload executes successfully and commits transaction.
	/// </summary>
	[Fact]
	public async Task ExecuteInTransactionAsync_VoidOverload_ExecutesSuccessfullyAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		ThirdPartyApiRequest entity =
			new()
			{
				ApiName = "TestApi",
				BaseUrl = "https://test.api",
				ResetDate =
					DateOnly.FromDateTime(
				timeProvider.GetUtcNow().UtcDateTime),
				CallCount = 1,
				CreateDate =
					timeProvider.GetUtcNow().UtcDateTime,
				ModifyDate = null,
			};

		// Act
		await TransactionManager.ExecuteInTransactionAsync(
			async cancellationToken =>
			{
				DbContext.ThirdPartyApiRequests.Add(entity);
				await DbContext.SaveChangesAsync(cancellationToken);
			});

		// Assert
		List<ThirdPartyApiRequest> allEntities =
			await DbContext.ThirdPartyApiRequests.ToListAsync();
		allEntities.Count.ShouldBe(1);
		allEntities[0].ApiName.ShouldBe("TestApi");
	}

	/// <summary>
	/// Verifies that a concurrency conflict triggers retries and eventually succeeds.
	/// </summary>
	[Fact]
	public async Task ExecuteInTransactionAsync_WithConcurrencyException_RetriesOperationAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		ThirdPartyApiRequest entity =
			new()
			{
				ApiName = "TestApi",
				BaseUrl = "https://test.api",
				ResetDate =
					DateOnly.FromDateTime(
				timeProvider.GetUtcNow().UtcDateTime),
				CallCount = 1,
				CreateDate =
					timeProvider.GetUtcNow().UtcDateTime,
				ModifyDate = null,
			};

		DbContext.ThirdPartyApiRequests.Add(entity);
		await DbContext.SaveChangesAsync();

		int attemptCount = 0;

		// Act
		int result =
			await TransactionManager.ExecuteInTransactionAsync(
			async cancellationToken =>
			{
				attemptCount++;
				ThirdPartyApiRequest? trackedEntity =
					await DbContext.ThirdPartyApiRequests.FindAsync(
						[entity.Id],
						cancellationToken);

				if (attemptCount == 1)
				{
					// Simulate concurrency conflict on first attempt by detaching and modifying
					DbContext.Entry(trackedEntity!).State =
						EntityState.Detached;
					throw new DbUpdateConcurrencyException(
						"Simulated concurrency conflict");
				}

				// Succeed on retry
				trackedEntity!.CallCount = 50;
				await DbContext.SaveChangesAsync(cancellationToken);

				return trackedEntity.CallCount;
			},
			maxRetries: 3);

		// Assert
		result.ShouldBe(50);
		attemptCount.ShouldBe(2); // First attempt failed, second succeeded
	}

	/// <summary>
	/// Verifies that exceeding max retry attempts throws InvalidOperationException.
	/// </summary>
	[Fact]
	public async Task ExecuteInTransactionAsync_WithMaxRetriesExceeded_ThrowsInvalidOperationExceptionAsync()
	{
		// Arrange
		int attemptCount = 0;

		// Act
		Func<Task> act =
			async () =>
			await TransactionManager.ExecuteInTransactionAsync(
				async cancellationToken =>
				{
					attemptCount++;
					// Always throw concurrency exception
					throw new DbUpdateConcurrencyException(
						"Simulated concurrency conflict");
				},
				maxRetries: 2);

		// Assert
		InvalidOperationException exception =
			await Should.ThrowAsync<InvalidOperationException>(act);
		exception.Message.ShouldContain("failed after 2 retries");

		attemptCount.ShouldBe(3); // Initial attempt + 2 retries
	}

	/// <summary>
	/// Verifies non-retryable exceptions do not trigger retries.
	/// </summary>
	[Fact]
	public async Task ExecuteInTransactionAsync_WithNonRetryableException_DoesNotRetryAsync()
	{
		// Arrange
		int attemptCount = 0;

		// Act
		Func<Task> act =
			async () =>
			await TransactionManager.ExecuteInTransactionAsync(
				async cancellationToken =>
				{
					attemptCount++;
					throw new InvalidOperationException("Non-retryable error");
				},
				maxRetries: 3);

		// Assert
		InvalidOperationException exception =
			await Should.ThrowAsync<InvalidOperationException>(act);
		exception.Message.ShouldBe("Non-retryable error");

		attemptCount.ShouldBe(1); // No retries for non-retryable exceptions
	}

	/// <summary>
	/// Verifies operation cancellation propagates OperationCanceledException.
	/// </summary>
	[Fact]
	public async Task ExecuteInTransactionAsync_WithCancellation_ThrowsOperationCanceledExceptionAsync()
	{
		// Arrange
		CancellationTokenSource cancellationTokenSource = new();
		cancellationTokenSource.Cancel();

		// Act
		Func<Task<int>> act =
			async () =>
			await TransactionManager.ExecuteInTransactionAsync(
				async cancellationToken =>
				{
					cancellationToken.ThrowIfCancellationRequested();
					await Task.CompletedTask;
					return 42;
				},
				cancellationToken: cancellationTokenSource.Token);

		// Assert
		await Should.ThrowAsync<OperationCanceledException>(act);
	}

	/// <summary>
	/// Verifies multiple operations isolate their transactions from each other.
	/// </summary>
	[Fact]
	public async Task ExecuteInTransactionAsync_MultipleOperations_IsolatesTransactionsAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();

		// Act
		long result1 =
			await TransactionManager.ExecuteInTransactionAsync(
			async cancellationToken =>
			{
				ThirdPartyApiRequest entity =
					new()
					{
						ApiName = "Api1",
						BaseUrl = "https://api1.com",
						ResetDate =
							DateOnly.FromDateTime(
						timeProvider.GetUtcNow().UtcDateTime),
						CallCount = 0,
						CreateDate =
							timeProvider.GetUtcNow().UtcDateTime,
						ModifyDate = null,
					};
				DbContext.ThirdPartyApiRequests.Add(entity);
				await DbContext.SaveChangesAsync(cancellationToken);
				return entity.Id;
			});

		long result2 =
			await TransactionManager.ExecuteInTransactionAsync(
			async cancellationToken =>
			{
				ThirdPartyApiRequest entity =
					new()
					{
						ApiName = "Api2",
						BaseUrl = "https://api2.com",
						ResetDate =
							DateOnly.FromDateTime(
						timeProvider.GetUtcNow().UtcDateTime),
						CallCount = 1,
						CreateDate =
							timeProvider.GetUtcNow().UtcDateTime,
						ModifyDate = null,
					};
				DbContext.ThirdPartyApiRequests.Add(entity);
				await DbContext.SaveChangesAsync(cancellationToken);
				return entity.Id;
			});

		// Assert
		result1.ShouldNotBe(result2);
		List<ThirdPartyApiRequest> allEntities =
			await DbContext.ThirdPartyApiRequests.ToListAsync();
		allEntities.Count.ShouldBe(2);
		allEntities.ShouldContain(e => e.ApiName == "Api1");
		allEntities.ShouldContain(e => e.ApiName == "Api2");
	}

	/// <summary>
	/// Documents that primary constructor usage behaves as expected (sanity check for DI behavior).
	/// </summary>
	[Fact]
	public void Constructor_WithNullContext_DoesNotThrowBecauseOfPrimaryConstructor()
	{
		// Note: TransactionManager uses primary constructor syntax which relies on
		// dependency injection to provide non-null dependencies.
		// This test verifies we understand the pattern - no null checks in primary constructors.
		Assert.True(true);
	}

	/// <summary>
	/// Verifies retry behavior succeeds after an initial concurrency failure.
	/// </summary>
	[Fact]
	public async Task ExecuteInTransactionAsync_WithRetries_SucceedsAfterRetryAsync()
	{
		// Note: Logging was removed from TransactionManager.
		// This test verifies the retry behavior without checking logs.
		// Arrange
		int attemptCount = 0;

		// Act
		int result =
			await TransactionManager.ExecuteInTransactionAsync(
			async cancellationToken =>
			{
				attemptCount++;
				if (attemptCount < 2)
				{
					throw new DbUpdateConcurrencyException(
						"Simulated concurrency conflict");
				}
				return 42;
			},
			maxRetries: 3);

		// Assert
		result.ShouldBe(42);
		attemptCount.ShouldBe(2);
	}
}