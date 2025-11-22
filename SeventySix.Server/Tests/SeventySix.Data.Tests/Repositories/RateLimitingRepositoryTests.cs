// <copyright file="RateLimitingRepositoryTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using SeventySix.BusinessLogic.Configuration;
using SeventySix.BusinessLogic.Entities;
using SeventySix.BusinessLogic.Infrastructure;
using SeventySix.BusinessLogic.Interfaces;
using SeventySix.Data;
using SeventySix.Data.Infrastructure;
using SeventySix.Data.Repositories;
using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Data.Tests.Repositories;

/// <summary>
/// Tests for RateLimitingService using real PostgreSQL database.
/// Tests verify that rate limiting state persists correctly and handles concurrent requests.
/// All tests share a single PostgreSQL instance to match production behavior.
/// </summary>
public class RateLimitingRepositoryTests : DataPostgreSqlTestBase, IClassFixture<TestcontainersPostgreSqlFixture>
{
	private readonly Mock<ILogger<RateLimitingService>> LoggerMock;
	private readonly Mock<ILogger<ThirdPartyApiRequestRepository>> RepoLoggerMock;
	private readonly IOptions<OpenWeatherOptions> Options;

	/// <summary>
	/// Initializes a new instance of the <see cref="RateLimitingRepositoryTests"/> class.
	/// </summary>
	/// <param name="fixture">PostgreSQL fixture.</param>
	public RateLimitingRepositoryTests(TestcontainersPostgreSqlFixture fixture)
		: base(fixture)
	{
		LoggerMock = new Mock<ILogger<RateLimitingService>>();
		RepoLoggerMock = new Mock<ILogger<ThirdPartyApiRequestRepository>>();
		Options = Microsoft.Extensions.Options.Options.Create(new OpenWeatherOptions
		{
			ApiKey = "test_key",
			BaseUrl = "https://api.test.com",
			DailyCallLimit = 100,
		});
	}

	[Fact]
	public async Task CanMakeRequestAsync_WhenNoRecordExists_ReturnsTrueAsync()
	{
		// Arrange
		await using ApplicationDbContext context = CreateDbContext();
		ThirdPartyApiRequestRepository repository = new(context, RepoLoggerMock.Object);
		TransactionManager transactionManager = new(context);
		RateLimitingService sut = new(LoggerMock.Object, repository, transactionManager, Options);

		// Act
		bool result = await sut.CanMakeRequestAsync("TestApi");

		// Assert
		result.Should().BeTrue();
	}

	[Fact]
	public async Task TryIncrementRequestCountAsync_FirstCall_CreatesNewRecordAsync()
	{
		// Arrange
		await using ApplicationDbContext context = CreateDbContext();
		ThirdPartyApiRequestRepository repository = new(context, RepoLoggerMock.Object);
		TransactionManager transactionManager = new(context);
		RateLimitingService sut = new(LoggerMock.Object, repository, transactionManager, Options);

		// Act
		bool result = await sut.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");

		// Assert
		result.Should().BeTrue();

		ThirdPartyApiRequest? record = await repository.GetByApiNameAndDateAsync("TestApi", DateOnly.FromDateTime(DateTime.UtcNow));
		record.Should().NotBeNull();
		record!.CallCount.Should().Be(1);
		record.BaseUrl.Should().Be("https://api.test.com");
	}

	[Fact]
	public async Task TryIncrementRequestCountAsync_MultipleCalls_IncrementsCounterAsync()
	{
		// Arrange
		await using ApplicationDbContext context = CreateDbContext();
		ThirdPartyApiRequestRepository repository = new(context, RepoLoggerMock.Object);
		TransactionManager transactionManager = new(context);
		RateLimitingService sut = new(LoggerMock.Object, repository, transactionManager, Options);

		// Act
		await sut.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");
		await sut.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");
		await sut.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");

		// Assert
		int count = await sut.GetRequestCountAsync("TestApi");
		count.Should().Be(3);
	}

	[Fact]
	public async Task TryIncrementRequestCountAsync_AtLimit_ReturnsFalseAsync()
	{
		// Arrange
		await using ApplicationDbContext context = CreateDbContext();
		ThirdPartyApiRequestRepository repository = new(context, RepoLoggerMock.Object);
		TransactionManager transactionManager = new(context);
		RateLimitingService sut = new(LoggerMock.Object, repository, transactionManager, Options);

		// Consume all quota
		for (int i = 0; i < 100; i++)
		{
			await sut.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");
		}

		// Act
		bool result = await sut.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");

		// Assert
		result.Should().BeFalse();
	}

	[Fact]
	public async Task GetRemainingQuotaAsync_AfterIncrements_ReturnsCorrectValueAsync()
	{
		// Arrange
		await using ApplicationDbContext context = CreateDbContext();
		ThirdPartyApiRequestRepository repository = new(context, RepoLoggerMock.Object);
		TransactionManager transactionManager = new(context);
		RateLimitingService sut = new(LoggerMock.Object, repository, transactionManager, Options);

		// Act
		await sut.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");
		await sut.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");
		await sut.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");

		int remaining = await sut.GetRemainingQuotaAsync("TestApi");

		// Assert
		remaining.Should().Be(97);
	}

	[Fact]
	public async Task ResetCounterAsync_ResetsCallCountToZeroAsync()
	{
		// Arrange
		await using ApplicationDbContext context = CreateDbContext();
		ThirdPartyApiRequestRepository repository = new(context, RepoLoggerMock.Object);
		TransactionManager transactionManager = new(context);
		RateLimitingService sut = new(LoggerMock.Object, repository, transactionManager, Options);

		await sut.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");
		await sut.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");

		// Act
		await sut.ResetCounterAsync("TestApi");

		// Assert
		int count = await sut.GetRequestCountAsync("TestApi");
		count.Should().Be(0);
	}

	[Fact]
	public async Task RateLimiting_PersistsAcrossServiceInstancesAsync()
	{
		// Arrange - First service instance
		await using ApplicationDbContext context1 = CreateDbContext();
		ThirdPartyApiRequestRepository repository1 = new(context1, RepoLoggerMock.Object);
		TransactionManager transactionManager1 = new(context1);
		RateLimitingService service1 = new(LoggerMock.Object, repository1, transactionManager1, Options);

		await service1.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");
		await service1.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");

		// Act - Second service instance (simulates application restart)
		await using ApplicationDbContext context2 = CreateDbContext();
		ThirdPartyApiRequestRepository repository2 = new(context2, RepoLoggerMock.Object);
		TransactionManager transactionManager2 = new(context2);
		RateLimitingService service2 = new(LoggerMock.Object, repository2, transactionManager2, Options);

		int count = await service2.GetRequestCountAsync("TestApi");
		int remaining = await service2.GetRemainingQuotaAsync("TestApi");

		// Assert
		count.Should().Be(2, "state should persist across service instances");
		remaining.Should().Be(98, "remaining quota should be calculated from persisted state");
	}

	[Fact]
	public async Task ConcurrentRequests_HandledCorrectlyAsync()
	{
		// Arrange & Act - Each concurrent request gets its own DbContext scope
		Task<(bool Success, bool Result, int Index, string? Error)>[] tasks = [.. Enumerable.Range(0, 10)
			.Select(async i =>
			{
				try
				{
					await using ApplicationDbContext context = CreateDbContext();
					ThirdPartyApiRequestRepository repository = new(context, RepoLoggerMock.Object);
					TransactionManager transactionManager = new(context);
					RateLimitingService service = new(LoggerMock.Object, repository, transactionManager, Options);
					bool result = await service.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");
					return (Success: true, Result: result, Index: i, Error: (string?)null);
				}
				catch (Exception ex)
				{
					return (Success: false, Result: false, Index: i, Error: ex.Message);
				}
			})];

		(bool Success, bool Result, int Index, string? Error)[] results = await Task.WhenAll(tasks);

		// Log results for debugging
		int successCount = results.Count(r => r.Success && r.Result);
		int failureCount = results.Count(r => !r.Success);
		int falseCount = results.Count(r => r.Success && !r.Result);

		// Assert
		results.Should().AllSatisfy(r =>
		{
			r.Success.Should().BeTrue($"operation {r.Index} should not throw exceptions, but got: {r.Error}");
			r.Result.Should().BeTrue($"operation {r.Index} should return true");
		}, "all increments should succeed");

		// Verify final count with a fresh context
		await using ApplicationDbContext verifyContext = CreateDbContext();
		ThirdPartyApiRequestRepository verifyRepository = new(verifyContext, RepoLoggerMock.Object);
		TransactionManager verifyTransactionManager = new(verifyContext);
		RateLimitingService verifyService = new(LoggerMock.Object, verifyRepository, verifyTransactionManager, Options);
		int count = await verifyService.GetRequestCountAsync("TestApi");
		count.Should().Be(10, "all concurrent increments should be persisted. Success: {0}, Failures: {1}, False: {2}", successCount, failureCount, falseCount);
	}
}