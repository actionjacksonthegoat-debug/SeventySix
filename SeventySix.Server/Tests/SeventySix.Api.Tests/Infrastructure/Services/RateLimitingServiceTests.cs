// <copyright file="RateLimitingServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Api.Infrastructure;
using SeventySix.ApiTracking;
using SeventySix.Shared.Interfaces;

namespace SeventySix.Api.Tests.Infrastructure.Services;

/// <summary>
/// Unit tests for RateLimitingService with database-backed implementation.
/// Tests use mocked repository to verify business logic without database dependencies.
/// Follows TDD best practices.
/// </summary>
public class RateLimitingServiceTests
{
	private readonly ILogger<RateLimitingService> Logger;
	private readonly IThirdPartyApiRequestRepository Repository;
	private readonly ITransactionManager TransactionManager;

	public RateLimitingServiceTests()
	{
		Logger =
			Substitute.For<ILogger<RateLimitingService>>();
		Repository =
			Substitute.For<IThirdPartyApiRequestRepository>();
		TransactionManager =
			Substitute.For<ITransactionManager>();

		// Setup TransactionManager to execute operations directly (pass-through)
		TransactionManager
			.ExecuteInTransactionAsync(
				Arg.Any<Func<CancellationToken, Task<bool>>>(),
				Arg.Any<int>(),
				Arg.Any<CancellationToken>())
			.Returns(async callInfo =>
			{
				Func<CancellationToken, Task<bool>> operation =
					callInfo.ArgAt<
					Func<CancellationToken, Task<bool>>
				>(0);

				CancellationToken ct =
					callInfo.ArgAt<CancellationToken>(2);

				return await operation(ct);
			});

		TransactionManager
			.ExecuteInTransactionAsync(
				Arg.Any<Func<CancellationToken, Task>>(),
				Arg.Any<int>(),
				Arg.Any<CancellationToken>())
			.Returns(async callInfo =>
			{
				Func<CancellationToken, Task> operation =
					callInfo.ArgAt<
					Func<CancellationToken, Task>
				>(0);

				CancellationToken ct =
					callInfo.ArgAt<CancellationToken>(2);

				await operation(ct);
			});
	}

	private RateLimitingService CreateSut(
		TimeProvider? timeProvider = null,
		ThirdPartyApiLimitSettings? settings = null)
	{
		settings ??= new ThirdPartyApiLimitSettings
		{
			DefaultDailyLimit = 1000,
			Enabled = true,
			Limits = [],
		};

		IOptions<ThirdPartyApiLimitSettings> options =
			Options.Create(settings);

		return new RateLimitingService(
			Logger,
			Repository,
			TransactionManager,
			options,
			timeProvider ?? TimeProvider.System);
	}

	[Fact]
	public async Task CanMakeRequestAsync_WithNoRecord_ReturnsTrueAsync()
	{
		const string apiName = "TestApi";
		RateLimitingService sut = CreateSut();

		Repository
			.GetByApiNameAndDateAsync(
				apiName,
				Arg.Any<DateOnly>(),
				Arg.Any<CancellationToken>())
			.Returns((ThirdPartyApiRequest?)null);

		bool result =
			await sut.CanMakeRequestAsync(apiName);

		Assert.True(result);
	}

	[Fact]
	public async Task CanMakeRequestAsync_UnderLimit_ReturnsTrueAsync()
	{
		const string apiName = "TestApi";
		FakeTimeProvider timeProvider = new();
		RateLimitingService sut =
			CreateSut(timeProvider);

		DateOnly today =
			DateOnly.FromDateTime(
			timeProvider.GetUtcNow().UtcDateTime);

		ThirdPartyApiRequest request =
			new()
		{
			Id = 1,
			ApiName = apiName,
			BaseUrl = "https://api.test.com",
			CallCount = 5,
			ResetDate = today,
		};

		Repository
			.GetByApiNameAndDateAsync(
				apiName,
				today,
				Arg.Any<CancellationToken>())
			.Returns(request);

		bool result =
			await sut.CanMakeRequestAsync(apiName);

		Assert.True(result);
	}

	[Fact]
	public async Task CanMakeRequestAsync_AtLimit_ReturnsFalseAsync()
	{
		const string apiName = "TestApi";
		FakeTimeProvider timeProvider = new();
		RateLimitingService sut =
			CreateSut(timeProvider);

		DateOnly today =
			DateOnly.FromDateTime(
			timeProvider.GetUtcNow().UtcDateTime);

		ThirdPartyApiRequest request =
			new()
		{
			Id = 1,
			ApiName = apiName,
			BaseUrl = "https://api.test.com",
			CallCount = 1000,
			ResetDate = today,
		};

		Repository
			.GetByApiNameAndDateAsync(
				apiName,
				today,
				Arg.Any<CancellationToken>())
			.Returns(request);

		bool result =
			await sut.CanMakeRequestAsync(apiName);

		Assert.False(result);
	}

	[Fact]
	public async Task TryIncrementRequestCountAsync_NoRecord_CreatesNewRecordAsync()
	{
		const string apiName = "TestApi";
		const string baseUrl = "https://api.test.com";
		FakeTimeProvider timeProvider = new();
		RateLimitingService sut =
			CreateSut(timeProvider);

		DateOnly today =
			DateOnly.FromDateTime(
			timeProvider.GetUtcNow().UtcDateTime);

		Repository
			.GetByApiNameAndDateAsync(
				apiName,
				today,
				Arg.Any<CancellationToken>())
			.Returns((ThirdPartyApiRequest?)null);

		Repository
			.CreateAsync(
				Arg.Any<ThirdPartyApiRequest>(),
				Arg.Any<CancellationToken>())
			.Returns(callInfo => callInfo.ArgAt<ThirdPartyApiRequest>(0));

		bool result =
			await sut.TryIncrementRequestCountAsync(apiName, baseUrl);

		Assert.True(result);
		await Repository
			.Received(1)
			.CreateAsync(
				Arg.Is<ThirdPartyApiRequest>(req =>
					req.ApiName == apiName
					&& req.BaseUrl == baseUrl
					&& req.CallCount == 1
					&& req.ResetDate == today),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task TryIncrementRequestCountAsync_UnderLimit_IncrementsCounterAsync()
	{
		const string apiName = "TestApi";
		const string baseUrl = "https://api.test.com";
		FakeTimeProvider timeProvider = new();
		RateLimitingService sut =
			CreateSut(timeProvider);

		DateOnly today =
			DateOnly.FromDateTime(
			timeProvider.GetUtcNow().UtcDateTime);

		ThirdPartyApiRequest request =
			new()
		{
			Id = 1,
			ApiName = apiName,
			BaseUrl = baseUrl,
			CallCount = 5,
			ResetDate = today,
		};

		Repository
			.GetByApiNameAndDateAsync(
				apiName,
				today,
				Arg.Any<CancellationToken>())
			.Returns(request);

		Repository
			.UpdateAsync(
				Arg.Any<ThirdPartyApiRequest>(),
				Arg.Any<CancellationToken>())
			.Returns(callInfo => callInfo.ArgAt<ThirdPartyApiRequest>(0));

		bool result =
			await sut.TryIncrementRequestCountAsync(apiName, baseUrl);

		Assert.True(result);
		Assert.Equal(6, request.CallCount);
		await Repository
			.Received(1)
			.UpdateAsync(request, Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task TryIncrementRequestCountAsync_AtLimit_ReturnsFalseAsync()
	{
		const string apiName = "TestApi";
		const string baseUrl = "https://api.test.com";
		FakeTimeProvider timeProvider = new();
		RateLimitingService sut =
			CreateSut(timeProvider);

		DateOnly today =
			DateOnly.FromDateTime(
			timeProvider.GetUtcNow().UtcDateTime);

		ThirdPartyApiRequest request =
			new()
		{
			Id = 1,
			ApiName = apiName,
			BaseUrl = baseUrl,
			CallCount = 1000,
			ResetDate = today,
		};

		Repository
			.GetByApiNameAndDateAsync(
				apiName,
				today,
				Arg.Any<CancellationToken>())
			.Returns(request);

		bool result =
			await sut.TryIncrementRequestCountAsync(apiName, baseUrl);

		Assert.False(result);
		Assert.Equal(1000, request.CallCount);
		await Repository
			.DidNotReceive()
			.UpdateAsync(
				Arg.Any<ThirdPartyApiRequest>(),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task GetRequestCountAsync_NoRecord_ReturnsZeroAsync()
	{
		const string apiName = "TestApi";
		RateLimitingService sut = CreateSut();

		Repository
			.GetByApiNameAndDateAsync(
				apiName,
				Arg.Any<DateOnly>(),
				Arg.Any<CancellationToken>())
			.Returns((ThirdPartyApiRequest?)null);

		int count =
			await sut.GetRequestCountAsync(apiName);

		Assert.Equal(0, count);
	}

	[Fact]
	public async Task GetRemainingQuotaAsync_NoRecord_ReturnsFullLimitAsync()
	{
		const string apiName = "TestApi";
		RateLimitingService sut = CreateSut();

		Repository
			.GetByApiNameAndDateAsync(
				apiName,
				Arg.Any<DateOnly>(),
				Arg.Any<CancellationToken>())
			.Returns((ThirdPartyApiRequest?)null);

		int remaining =
			await sut.GetRemainingQuotaAsync(apiName);

		Assert.Equal(1000, remaining);
	}

	[Fact]
	public void GetTimeUntilReset_ReturnsPositiveTimeSpan()
	{
		RateLimitingService sut = CreateSut();

		TimeSpan timeUntilReset = sut.GetTimeUntilReset();

		Assert.True(timeUntilReset.TotalSeconds > 0);
		Assert.True(timeUntilReset.TotalHours <= 24);
	}

	[Fact]
	public async Task CanMakeRequestAsync_RespectsConfiguredLimit_WhenBrevoEmailHas250LimitAsync()
	{
		FakeTimeProvider timeProvider = new();
		ThirdPartyApiLimitSettings settings =
			new()
		{
			Enabled = true,
			DefaultDailyLimit = 1000,
			Limits =
			new Dictionary<string, ThirdPartyApiLimit>
			{
				{
					ExternalApiConstants.BrevoEmail,
					new ThirdPartyApiLimit { DailyLimit = 250, Enabled = true }
				},
			},
		};

		RateLimitingService sut =
			CreateSut(timeProvider, settings);

		DateOnly today =
			DateOnly.FromDateTime(
			timeProvider.GetUtcNow().UtcDateTime);

		ThirdPartyApiRequest existingRequest =
			new()
		{
			ApiName =
			ExternalApiConstants.BrevoEmail,
			BaseUrl = "smtp-relay.brevo.com",
			CallCount = 249,
			LastCalledAt =
			timeProvider.GetUtcNow().UtcDateTime.AddMinutes(-5),
			ResetDate = today,
		};

		Repository
			.GetByApiNameAndDateAsync(
				ExternalApiConstants.BrevoEmail,
				today,
				Arg.Any<CancellationToken>())
			.Returns(existingRequest);

		bool canMake =
			await sut.CanMakeRequestAsync(
			ExternalApiConstants.BrevoEmail,
			CancellationToken.None);

		Assert.True(canMake);
	}

	[Fact]
	public async Task CanMakeRequestAsync_AlwaysReturnsTrue_WhenRateLimitingDisabledAsync()
	{
		ThirdPartyApiLimitSettings settings =
			new()
		{
			Enabled = false,
			DefaultDailyLimit = 1000,
		};

		RateLimitingService sut =
			CreateSut(null, settings);

		bool canMake =
			await sut.CanMakeRequestAsync(
			ExternalApiConstants.BrevoEmail,
			CancellationToken.None);

		Assert.True(canMake);
	}
}
