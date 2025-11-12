// <copyright file="RateLimitingServiceIntegrationTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using SeventySix.BusinessLogic.Configuration;
using SeventySix.Data.Infrastructure;
using SeventySix.DataAccess.Repositories;
using SeventySix.DataAccess.Services;
using SeventySix.DataAccess.Tests.Attributes;
using Xunit;

namespace SeventySix.DataAccess.Tests.Integration;

/// <summary>
/// Integration tests for RateLimitingService using real PostgreSQL database.
/// Tests verify that rate limiting state persists correctly and handles concurrent requests.
/// All tests share a single PostgreSQL instance to match production behavior.
/// </summary>
public class RateLimitingServiceIntegrationTests : PostgreSqlTestBase, IClassFixture<PostgreSqlFixture>
{
	private readonly Mock<ILogger<RateLimitingService>> LoggerMock;
	private readonly Mock<ILogger<ThirdPartyApiRequestRepository>> RepoLoggerMock;
	private readonly IOptions<OpenWeatherOptions> Options;

	/// <summary>
	/// Initializes a new instance of the <see cref="RateLimitingServiceIntegrationTests"/> class.
	/// </summary>
	/// <param name="fixture">The shared PostgreSQL fixture.</param>
	public RateLimitingServiceIntegrationTests(PostgreSqlFixture fixture)
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

	[IntegrationTest]
	public async Task CanMakeRequestAsync_WhenNoRecordExists_ReturnsTrueAsync()
	{
		// Arrange
		await using var context = CreateDbContext();
		var repository = new ThirdPartyApiRequestRepository(context, RepoLoggerMock.Object);
		var transactionManager = new TransactionManager(context, Mock.Of<ILogger<TransactionManager>>());
		var sut = new RateLimitingService(LoggerMock.Object, repository, transactionManager, Options);

		// Act
		var result = await sut.CanMakeRequestAsync("TestApi");

		// Assert
		result.Should().BeTrue();
	}

	[IntegrationTest]
	public async Task TryIncrementRequestCountAsync_FirstCall_CreatesNewRecordAsync()
	{
		// Arrange
		await using var context = CreateDbContext();
		var repository = new ThirdPartyApiRequestRepository(context, RepoLoggerMock.Object);
		var transactionManager = new TransactionManager(context, Mock.Of<ILogger<TransactionManager>>());
		var sut = new RateLimitingService(LoggerMock.Object, repository, transactionManager, Options);

		// Act
		var result = await sut.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");

		// Assert
		result.Should().BeTrue();

		var record = await repository.GetByApiNameAndDateAsync("TestApi", DateOnly.FromDateTime(DateTime.UtcNow));
		record.Should().NotBeNull();
		record!.CallCount.Should().Be(1);
		record.BaseUrl.Should().Be("https://api.test.com");
	}

	[IntegrationTest]
	public async Task TryIncrementRequestCountAsync_MultipleCalls_IncrementsCounterAsync()
	{
		// Arrange
		await using var context = CreateDbContext();
		var repository = new ThirdPartyApiRequestRepository(context, RepoLoggerMock.Object);
		var transactionManager = new TransactionManager(context, Mock.Of<ILogger<TransactionManager>>());
		var sut = new RateLimitingService(LoggerMock.Object, repository, transactionManager, Options);

		// Act
		await sut.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");
		await sut.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");
		await sut.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");

		// Assert
		var count = await sut.GetRequestCountAsync("TestApi");
		count.Should().Be(3);
	}

	[IntegrationTest]
	public async Task TryIncrementRequestCountAsync_AtLimit_ReturnsFalseAsync()
	{
		// Arrange
		await using var context = CreateDbContext();
		var repository = new ThirdPartyApiRequestRepository(context, RepoLoggerMock.Object);
		var transactionManager = new TransactionManager(context, Mock.Of<ILogger<TransactionManager>>());
		var sut = new RateLimitingService(LoggerMock.Object, repository, transactionManager, Options);

		// Consume all quota
		for (int i = 0; i < 100; i++)
		{
			await sut.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");
		}

		// Act
		var result = await sut.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");

		// Assert
		result.Should().BeFalse();
	}

	[IntegrationTest]
	public async Task GetRemainingQuotaAsync_AfterIncrements_ReturnsCorrectValueAsync()
	{
		// Arrange
		await using var context = CreateDbContext();
		var repository = new ThirdPartyApiRequestRepository(context, RepoLoggerMock.Object);
		var transactionManager = new TransactionManager(context, Mock.Of<ILogger<TransactionManager>>());
		var sut = new RateLimitingService(LoggerMock.Object, repository, transactionManager, Options);

		// Act
		await sut.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");
		await sut.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");
		await sut.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");

		var remaining = await sut.GetRemainingQuotaAsync("TestApi");

		// Assert
		remaining.Should().Be(97); // 100 - 3
	}

	[IntegrationTest]
	public async Task ResetCounterAsync_ResetsCallCountToZeroAsync()
	{
		// Arrange
		await using var context = CreateDbContext();
		var repository = new ThirdPartyApiRequestRepository(context, RepoLoggerMock.Object);
		var transactionManager = new TransactionManager(context, Mock.Of<ILogger<TransactionManager>>());
		var sut = new RateLimitingService(LoggerMock.Object, repository, transactionManager, Options);

		await sut.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");
		await sut.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");

		// Act
		await sut.ResetCounterAsync("TestApi");

		// Assert
		var count = await sut.GetRequestCountAsync("TestApi");
		count.Should().Be(0);
	}

	[IntegrationTest]
	public async Task RateLimiting_PersistsAcrossServiceInstancesAsync()
	{
		// Arrange - First service instance
		await using var context1 = CreateDbContext();
		var repository1 = new ThirdPartyApiRequestRepository(context1, RepoLoggerMock.Object);
		var transactionManager1 = new TransactionManager(context1, Mock.Of<ILogger<TransactionManager>>());
		var service1 = new RateLimitingService(LoggerMock.Object, repository1, transactionManager1, Options);

		await service1.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");
		await service1.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");

		// Act - Second service instance (simulates application restart)
		await using var context2 = CreateDbContext();
		var repository2 = new ThirdPartyApiRequestRepository(context2, RepoLoggerMock.Object);
		var transactionManager2 = new TransactionManager(context2, Mock.Of<ILogger<TransactionManager>>());
		var service2 = new RateLimitingService(LoggerMock.Object, repository2, transactionManager2, Options);

		var count = await service2.GetRequestCountAsync("TestApi");
		var remaining = await service2.GetRemainingQuotaAsync("TestApi");

		// Assert
		count.Should().Be(2, "state should persist across service instances");
		remaining.Should().Be(98, "remaining quota should be calculated from persisted state");
	}

	[IntegrationTest]
	public async Task ConcurrentRequests_HandledCorrectlyAsync()
	{
		// Arrange & Act - Each concurrent request gets its own DbContext scope
		var tasks = Enumerable.Range(0, 10)
			.Select(async i =>
			{
				try
				{
					await using var context = CreateDbContext();
					var repository = new ThirdPartyApiRequestRepository(context, RepoLoggerMock.Object);
					var transactionManager = new TransactionManager(context, Mock.Of<ILogger<TransactionManager>>());
					var service = new RateLimitingService(LoggerMock.Object, repository, transactionManager, Options);
					var result = await service.TryIncrementRequestCountAsync("TestApi", "https://api.test.com");
					return (Success: true, Result: result, Index: i, Error: (string?)null);
				}
				catch (Exception ex)
				{
					return (Success: false, Result: false, Index: i, Error: ex.Message);
				}
			})
			.ToArray();

		var results = await Task.WhenAll(tasks);

		// Log results for debugging
		var successCount = results.Count(r => r.Success && r.Result);
		var failureCount = results.Count(r => !r.Success);
		var falseCount = results.Count(r => r.Success && !r.Result);

		// Assert
		results.Should().AllSatisfy(r =>
		{
			r.Success.Should().BeTrue($"operation {r.Index} should not throw exceptions, but got: {r.Error}");
			r.Result.Should().BeTrue($"operation {r.Index} should return true");
		}, "all increments should succeed");

		// Verify final count with a fresh context
		await using var verifyContext = CreateDbContext();
		var verifyRepository = new ThirdPartyApiRequestRepository(verifyContext, RepoLoggerMock.Object);
		var verifyTransactionManager = new TransactionManager(verifyContext, Mock.Of<ILogger<TransactionManager>>());
		var verifyService = new RateLimitingService(LoggerMock.Object, verifyRepository, verifyTransactionManager, Options);
		var count = await verifyService.GetRequestCountAsync("TestApi");
		count.Should().Be(10, "all concurrent increments should be persisted. Success: {0}, Failures: {1}, False: {2}", successCount, failureCount, falseCount);
	}
}