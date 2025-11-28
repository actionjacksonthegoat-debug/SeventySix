// <copyright file="RateLimitingServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Moq;
using SeventySix.ApiTracking;
using SeventySix.Infrastructure;
using SeventySix.Shared;

namespace SeventySix.Tests.Infrastructure;

/// <summary>
/// Unit tests for RateLimitingService with database-backed implementation.
/// Tests use mocked repository to verify business logic without database dependencies.
/// Follows TDD best practices.
/// </summary>
public class RateLimitingServiceTests
{
	private readonly Mock<ILogger<RateLimitingService>> MockLogger;
	private readonly Mock<IThirdPartyApiRequestRepository> MockRepository;
	private readonly Mock<ITransactionManager> MockTransactionManager;
	private readonly RateLimitingService Sut;

	public RateLimitingServiceTests()
	{
		MockLogger = new Mock<ILogger<RateLimitingService>>();
		MockRepository = new Mock<IThirdPartyApiRequestRepository>();
		MockTransactionManager = new Mock<ITransactionManager>();

		// Setup TransactionManager to execute operations directly (pass-through)
		MockTransactionManager
			.Setup(tm => tm.ExecuteInTransactionAsync(
				It.IsAny<Func<CancellationToken, Task<bool>>>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()))
			.Returns<Func<CancellationToken, Task<bool>>, int, CancellationToken>(
				async (operation, _, ct) => await operation(ct));

		MockTransactionManager
			.Setup(tm => tm.ExecuteInTransactionAsync(
				It.IsAny<Func<CancellationToken, Task>>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()))
			.Returns<Func<CancellationToken, Task>, int, CancellationToken>(
				async (operation, _, ct) => await operation(ct));

		Sut = new RateLimitingService(MockLogger.Object, MockRepository.Object, MockTransactionManager.Object);
	}

	[Fact]
	public async Task CanMakeRequestAsync_WithNoRecord_ReturnsTrueAsync()
	{
		const string apiName = "TestApi";
		MockRepository
			.Setup(r => r.GetByApiNameAndDateAsync(apiName, It.IsAny<DateOnly>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync((ThirdPartyApiRequest?)null);

		bool result = await Sut.CanMakeRequestAsync(apiName);

		Assert.True(result);
	}

	[Fact]
	public async Task CanMakeRequestAsync_UnderLimit_ReturnsTrueAsync()
	{
		const string apiName = "TestApi";
		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
		ThirdPartyApiRequest request = new()
		{
			Id = 1,
			ApiName = apiName,
			BaseUrl = "https://api.test.com",
			CallCount = 5,
			ResetDate = today
		};

		MockRepository
			.Setup(r => r.GetByApiNameAndDateAsync(apiName, today, It.IsAny<CancellationToken>()))
			.ReturnsAsync(request);

		bool result = await Sut.CanMakeRequestAsync(apiName);

		Assert.True(result);
	}

	[Fact]
	public async Task CanMakeRequestAsync_AtLimit_ReturnsFalseAsync()
	{
		const string apiName = "TestApi";
		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
		ThirdPartyApiRequest request = new()
		{
			Id = 1,
			ApiName = apiName,
			BaseUrl = "https://api.test.com",
			CallCount = 1000,
			ResetDate = today
		};

		MockRepository
			.Setup(r => r.GetByApiNameAndDateAsync(apiName, today, It.IsAny<CancellationToken>()))
			.ReturnsAsync(request);

		bool result = await Sut.CanMakeRequestAsync(apiName);

		Assert.False(result);
	}

	[Fact]
	public async Task TryIncrementRequestCountAsync_NoRecord_CreatesNewRecordAsync()
	{
		const string apiName = "TestApi";
		const string baseUrl = "https://api.test.com";
		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);

		MockRepository
			.Setup(r => r.GetByApiNameAndDateAsync(apiName, today, It.IsAny<CancellationToken>()))
			.ReturnsAsync((ThirdPartyApiRequest?)null);

		MockRepository
			.Setup(r => r.CreateAsync(It.IsAny<ThirdPartyApiRequest>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync((ThirdPartyApiRequest req, CancellationToken ct) => req);

		bool result = await Sut.TryIncrementRequestCountAsync(apiName, baseUrl);

		Assert.True(result);
		MockRepository.Verify(
			r => r.CreateAsync(
				It.Is<ThirdPartyApiRequest>(req =>
					req.ApiName == apiName &&
					req.BaseUrl == baseUrl &&
					req.CallCount == 1 &&
					req.ResetDate == today)),
			Times.Once);
	}

	[Fact]
	public async Task TryIncrementRequestCountAsync_UnderLimit_IncrementsCounterAsync()
	{
		const string apiName = "TestApi";
		const string baseUrl = "https://api.test.com";
		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
		ThirdPartyApiRequest request = new()
		{
			Id = 1,
			ApiName = apiName,
			BaseUrl = baseUrl,
			CallCount = 5,
			ResetDate = today
		};

		MockRepository
			.Setup(r => r.GetByApiNameAndDateAsync(apiName, today, It.IsAny<CancellationToken>()))
			.ReturnsAsync(request);

		MockRepository
			.Setup(r => r.UpdateAsync(It.IsAny<ThirdPartyApiRequest>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync((ThirdPartyApiRequest req, CancellationToken ct) => req);

		bool result = await Sut.TryIncrementRequestCountAsync(apiName, baseUrl);

		Assert.True(result);
		Assert.Equal(6, request.CallCount);
		MockRepository.Verify(
			r => r.UpdateAsync(request),
			Times.Once);
	}

	[Fact]
	public async Task TryIncrementRequestCountAsync_AtLimit_ReturnsFalseAsync()
	{
		const string apiName = "TestApi";
		const string baseUrl = "https://api.test.com";
		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
		ThirdPartyApiRequest request = new()
		{
			Id = 1,
			ApiName = apiName,
			BaseUrl = baseUrl,
			CallCount = 1000,
			ResetDate = today
		};

		MockRepository
			.Setup(r => r.GetByApiNameAndDateAsync(apiName, today, It.IsAny<CancellationToken>()))
			.ReturnsAsync(request);

		bool result = await Sut.TryIncrementRequestCountAsync(apiName, baseUrl);

		Assert.False(result);
		Assert.Equal(1000, request.CallCount);
		MockRepository.Verify(
			r => r.UpdateAsync(It.IsAny<ThirdPartyApiRequest>()),
			Times.Never);
	}

	[Fact]
	public async Task GetRequestCountAsync_NoRecord_ReturnsZeroAsync()
	{
		const string apiName = "TestApi";
		MockRepository
			.Setup(r => r.GetByApiNameAndDateAsync(apiName, It.IsAny<DateOnly>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync((ThirdPartyApiRequest?)null);

		int count = await Sut.GetRequestCountAsync(apiName);

		Assert.Equal(0, count);
	}

	[Fact]
	public async Task GetRemainingQuotaAsync_NoRecord_ReturnsFullLimitAsync()
	{
		const string apiName = "TestApi";
		MockRepository
			.Setup(r => r.GetByApiNameAndDateAsync(apiName, It.IsAny<DateOnly>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync((ThirdPartyApiRequest?)null);

		int remaining = await Sut.GetRemainingQuotaAsync(apiName);

		Assert.Equal(1000, remaining); // DEFAULT_DAILY_LIMIT
	}

	[Fact]
	public void GetTimeUntilReset_ReturnsPositiveTimeSpan()
	{
		TimeSpan timeUntilReset = Sut.GetTimeUntilReset();

		Assert.True(timeUntilReset.TotalSeconds > 0);
		Assert.True(timeUntilReset.TotalHours <= 24);
	}
}