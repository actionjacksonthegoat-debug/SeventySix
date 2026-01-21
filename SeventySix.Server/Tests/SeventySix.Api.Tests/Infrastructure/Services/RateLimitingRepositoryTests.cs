// <copyright file="RateLimitingRepositoryTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.Api.Infrastructure;
using SeventySix.ApiTracking;
using SeventySix.Shared;
using SeventySix.Shared.Persistence;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Api.Tests.Infrastructure.Services;

/// <summary>
/// Tests for RateLimitingService using real PostgreSQL database.
/// Tests verify that rate limiting state persists correctly and handles concurrent requests.
/// All tests share a single PostgreSQL instance to match production behavior.
/// </summary>
[Collection("DatabaseTests")]
public class RateLimitingRepositoryTests : DataPostgreSqlTestBase
{
	private readonly ILogger<RateLimitingService> LoggerMock;
	private readonly ILogger<ThirdPartyApiRequestRepository> RepoLoggerMock;

	/// <summary>
	/// Initializes a new instance of the <see cref="RateLimitingRepositoryTests"/> class.
	/// </summary>
	/// <param name="fixture">
	/// PostgreSQL fixture.
	/// </param>
	public RateLimitingRepositoryTests(TestcontainersPostgreSqlFixture fixture)
		: base(fixture)
	{
		LoggerMock =
			Substitute.For<ILogger<RateLimitingService>>();
		RepoLoggerMock =
			Substitute.For<
			ILogger<ThirdPartyApiRequestRepository>
		>();
	}

	private static IOptions<ThirdPartyApiLimitSettings> CreateSettings(
		int defaultDailyLimit = 1000,
		bool enabled = true)
	{
		return Options.Create(
			new ThirdPartyApiLimitSettings
			{
				DefaultDailyLimit = defaultDailyLimit,
				Enabled = enabled,
				Limits = [],
			});
	}

	[Fact]
	public async Task CanMakeRequestAsync_WhenNoRecordExists_ReturnsTrueAsync()
	{
		// Arrange
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string apiName =
			$"CanMakeApi_{testId}";
		await using ApiTrackingDbContext context = CreateApiTrackingDbContext();
		ThirdPartyApiRequestRepository repository =
			new(
			context,
			RepoLoggerMock);
		TransactionManager transactionManager =
			new(context);
		RateLimitingService sut =
			new(
			LoggerMock,
			repository,
			transactionManager,
			CreateSettings(),
			TimeProvider.System);

		// Act
		bool result =
			await sut.CanMakeRequestAsync(apiName);

		// Assert
		result.ShouldBeTrue();
	}

	[Fact]
	public async Task TryIncrementRequestCountAsync_FirstCall_CreatesNewRecordAsync()
	{
		// Arrange
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string apiName =
			$"TestApi_{testId}";
		await using ApiTrackingDbContext context = CreateApiTrackingDbContext();
		ThirdPartyApiRequestRepository repository =
			new(
			context,
			RepoLoggerMock);
		TransactionManager transactionManager =
			new(context);
		RateLimitingService sut =
			new(
			LoggerMock,
			repository,
			transactionManager,
			CreateSettings(),
			TimeProvider.System);

		// Act
		bool result =
			await sut.TryIncrementRequestCountAsync(
			apiName,
			"https://api.test.com"); // Assert
		result.ShouldBeTrue();

		ThirdPartyApiRequest? record =
			await repository.GetByApiNameAndDateAsync(
				apiName,
				DateOnly.FromDateTime(
					TimeProvider.System.GetUtcNow().UtcDateTime));
		record!.BaseUrl.ShouldBe("https://api.test.com");
	}

	[Fact]
	public async Task TryIncrementRequestCountAsync_MultipleCalls_IncrementsCounterAsync()
	{
		// Arrange
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string apiName =
			$"MultipleCallsApi_{testId}";
		await using ApiTrackingDbContext context = CreateApiTrackingDbContext();
		ThirdPartyApiRequestRepository repository =
			new(
			context,
			RepoLoggerMock);
		TransactionManager transactionManager =
			new(context);
		RateLimitingService sut =
			new(
			LoggerMock,
			repository,
			transactionManager,
			CreateSettings(),
			TimeProvider.System);

		// Act
		await sut.TryIncrementRequestCountAsync(
			apiName,
			"https://api.test.com");
		await sut.TryIncrementRequestCountAsync(
			apiName,
			"https://api.test.com");
		await sut.TryIncrementRequestCountAsync(
			apiName,
			"https://api.test.com");

		// Assert
		int count =
			await sut.GetRequestCountAsync(apiName);
		count.ShouldBe(3);
	}

	[Fact]
	public async Task TryIncrementRequestCountAsync_AtLimit_ReturnsFalseAsync()
	{
		// Arrange
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string apiName =
			$"AtLimitApi_{testId}";
		await using ApiTrackingDbContext context = CreateApiTrackingDbContext();
		ThirdPartyApiRequestRepository repository =
			new(
			context,
			RepoLoggerMock);
		TransactionManager transactionManager =
			new(context);
		RateLimitingService sut =
			new(
			LoggerMock,
			repository,
			transactionManager,
			CreateSettings(),
			TimeProvider.System);

		// Consume all quota
		for (int requestNumber = 0; requestNumber < 1000; requestNumber++)
		{
			await sut.TryIncrementRequestCountAsync(
				apiName,
				"https://api.test.com");
		}

		// Act
		bool result =
			await sut.TryIncrementRequestCountAsync(
			apiName,
			"https://api.test.com");

		// Assert
		result.ShouldBeFalse();
	}

	[Fact]
	public async Task GetRemainingQuotaAsync_AfterIncrements_ReturnsCorrectValueAsync()
	{
		// Arrange
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string apiName =
			$"TestApi_{testId}";
		await using ApiTrackingDbContext context = CreateApiTrackingDbContext();
		ThirdPartyApiRequestRepository repository =
			new(
			context,
			RepoLoggerMock);
		TransactionManager transactionManager =
			new(context);
		RateLimitingService sut =
			new(
			LoggerMock,
			repository,
			transactionManager,
			CreateSettings(),
			TimeProvider.System);

		// Act
		await sut.TryIncrementRequestCountAsync(
			apiName,
			"https://api.test.com");
		await sut.TryIncrementRequestCountAsync(
			apiName,
			"https://api.test.com");
		await sut.TryIncrementRequestCountAsync(
			apiName,
			"https://api.test.com");

		int remaining =
			await sut.GetRemainingQuotaAsync(apiName);

		// Assert
		remaining.ShouldBe(997);
	}

	[Fact]
	public async Task ResetCounterAsync_ResetsCallCountToZeroAsync()
	{
		// Arrange
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string apiName =
			$"TestApi_{testId}";
		await using ApiTrackingDbContext context = CreateApiTrackingDbContext();
		ThirdPartyApiRequestRepository repository =
			new(
			context,
			RepoLoggerMock);
		TransactionManager transactionManager =
			new(context);
		RateLimitingService sut =
			new(
			LoggerMock,
			repository,
			transactionManager,
			CreateSettings(),
			TimeProvider.System);

		await sut.TryIncrementRequestCountAsync(
			apiName,
			"https://api.test.com");
		await sut.TryIncrementRequestCountAsync(
			apiName,
			"https://api.test.com");

		// Act
		await sut.ResetCounterAsync(apiName);

		// Assert
		int count =
			await sut.GetRequestCountAsync(apiName);
		count.ShouldBe(0);
	}

	[Fact]
	public async Task RateLimiting_PersistsAcrossServiceInstancesAsync()
	{
		// Arrange - First service instance
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string apiName =
			$"PersistApi_{testId}";
		await using ApiTrackingDbContext context1 =
			CreateApiTrackingDbContext();
		ThirdPartyApiRequestRepository repository1 =
			new(
			context1,
			RepoLoggerMock);
		TransactionManager transactionManager1 =
			new(context1);
		RateLimitingService service1 =
			new(
			LoggerMock,
			repository1,
			transactionManager1,
			CreateSettings(),
			TimeProvider.System);

		await service1.TryIncrementRequestCountAsync(
			apiName,
			"https://api.test.com");
		await service1.TryIncrementRequestCountAsync(
			apiName,
			"https://api.test.com");

		// Act - Second service instance (simulates application restart)
		await using ApiTrackingDbContext context2 =
			CreateApiTrackingDbContext();
		ThirdPartyApiRequestRepository repository2 =
			new(
			context2,
			RepoLoggerMock);
		TransactionManager transactionManager2 =
			new(context2);
		RateLimitingService service2 =
			new(
			LoggerMock,
			repository2,
			transactionManager2,
			CreateSettings(),
			TimeProvider.System);

		int count =
			await service2.GetRequestCountAsync(apiName);
		int remaining =
			await service2.GetRemainingQuotaAsync(apiName);

		// Assert
		count.ShouldBe(
			2,
			"state should persist across service instances");
		remaining.ShouldBe(
			998,
			"remaining quota should be calculated from persisted state");
	}

	[Fact]
	public async Task ConcurrentRequests_HandledCorrectlyAsync()
	{
		// Arrange & Act - Each concurrent request gets its own DbContext scope
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string apiName =
			$"ConcurrentApi_{testId}";
		Task<(bool Success, bool Result, int Index, string? Error)>[] tasks =
			[
			.. Enumerable
				.Range(0, 10)
				.Select(i => ExecuteConcurrentIncrementAsync(i, apiName)),
		];

		(bool Success, bool Result, int Index, string? Error)[] results =
			await Task.WhenAll(tasks);

		AssertConcurrentResults(results);

		// Verify final count with a fresh context
		(
			RateLimitingService verifyService,
			ApiTrackingDbContext verifyContext
		) = CreateRateLimitingService();
		await using (verifyContext)
		{
			int count =
				await verifyService.GetRequestCountAsync(apiName);
			int successCount =
				results.Count(r => r.Success && r.Result);
			count.ShouldBe(
				10,
				$"all concurrent increments should be persisted. Success: {successCount}");
		}
	}

	private async Task<(
		bool Success,
		bool Result,
		int Index,
		string? Error
	)> ExecuteConcurrentIncrementAsync(int index, string apiName)
	{
		(RateLimitingService service, ApiTrackingDbContext context) =
			CreateRateLimitingService();
		await using (context)
		{
			bool result =
				await service.TryIncrementRequestCountAsync(
					apiName,
					"https://api.test.com");
			return (true, result, index, null);
		}
	}

	private static void AssertConcurrentResults(
		(bool Success, bool Result, int Index, string? Error)[] results)
	{
		foreach (
			(bool Success, bool Result, int Index, string? Error) r in results)
		{
			r.Success.ShouldBeTrue(
				$"operation {r.Index} should not throw exceptions, but got: {r.Error}");
			r.Result.ShouldBeTrue($"operation {r.Index} should return true");
		}
	}

	private (
		RateLimitingService Service,
		ApiTrackingDbContext Context
	) CreateRateLimitingService()
	{
		ApiTrackingDbContext context = CreateApiTrackingDbContext();
		ThirdPartyApiRequestRepository repository =
			new(
			context,
			RepoLoggerMock);
		TransactionManager transactionManager =
			new(context);
		RateLimitingService service =
			new(
			LoggerMock,
			repository,
			transactionManager,
			CreateSettings(),
			TimeProvider.System);
		return (service, context);
	}
}