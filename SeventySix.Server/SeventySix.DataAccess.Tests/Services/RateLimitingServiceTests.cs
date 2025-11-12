// <copyright file="RateLimitingServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using SeventySix.BusinessLogic.Configuration;
using SeventySix.DataAccess.Services;
using Xunit;

namespace SeventySix.DataAccess.Tests.Services;

/// <summary>
/// Unit tests for RateLimitingService.
/// Follows TDD best practices - tests written before implementation.
/// </summary>
public class RateLimitingServiceTests
{
	private readonly Mock<ILogger<RateLimitingService>> MockLogger;
	private readonly OpenWeatherOptions Options;
	private readonly RateLimitingService Sut;

	public RateLimitingServiceTests()
	{
		MockLogger = new Mock<ILogger<RateLimitingService>>();
		Options = new OpenWeatherOptions
		{
			ApiKey = "test-key",
			BaseUrl = "https://api.test.com",
			DailyCallLimit = 10, // Low limit for testing
		};

		IOptions<OpenWeatherOptions> optionsWrapper = Microsoft.Extensions.Options.Options.Create(Options);
		Sut = new RateLimitingService(MockLogger.Object, optionsWrapper);
	}

	[Fact]
	public void CanMakeRequest_WithUnderLimit_ReturnsTrue()
	{
		// Arrange
		const string apiName = "TestApi";

		// Act
		bool result = Sut.CanMakeRequest(apiName);

		// Assert
		Assert.True(result);
	}

	[Fact]
	public void CanMakeRequest_AtLimit_ReturnsFalse()
	{
		// Arrange
		const string apiName = "TestApi";
		for (int i = 0; i < Options.DailyCallLimit; i++)
		{
			Sut.TryIncrementRequestCount(apiName);
		}

		// Act
		bool result = Sut.CanMakeRequest(apiName);

		// Assert
		Assert.False(result);
	}

	[Fact]
	public void TryIncrementRequestCount_UnderLimit_IncrementsAndReturnsTrue()
	{
		// Arrange
		const string apiName = "TestApi";
		int initialCount = Sut.GetRequestCount(apiName);

		// Act
		bool result = Sut.TryIncrementRequestCount(apiName);

		// Assert
		Assert.True(result);
		Assert.Equal(initialCount + 1, Sut.GetRequestCount(apiName));
	}

	[Fact]
	public void TryIncrementRequestCount_AtLimit_DoesNotIncrementAndReturnsFalse()
	{
		// Arrange
		const string apiName = "TestApi";
		for (int i = 0; i < Options.DailyCallLimit; i++)
		{
			Sut.TryIncrementRequestCount(apiName);
		}

		// Act
		bool result = Sut.TryIncrementRequestCount(apiName);

		// Assert
		Assert.False(result);
		Assert.Equal(Options.DailyCallLimit, Sut.GetRequestCount(apiName));
	}

	[Fact]
	public void GetRemainingQuota_AfterSomeRequests_ReturnsCorrectValue()
	{
		// Arrange
		const string apiName = "TestApi";
		Sut.TryIncrementRequestCount(apiName);
		Sut.TryIncrementRequestCount(apiName);
		Sut.TryIncrementRequestCount(apiName);

		// Act
		int remaining = Sut.GetRemainingQuota(apiName);

		// Assert
		Assert.Equal(Options.DailyCallLimit - 3, remaining);
	}

	[Fact]
	public void GetRemainingQuota_AtLimit_ReturnsZero()
	{
		// Arrange
		const string apiName = "TestApi";
		for (int i = 0; i < Options.DailyCallLimit; i++)
		{
			Sut.TryIncrementRequestCount(apiName);
		}

		// Act
		int remaining = Sut.GetRemainingQuota(apiName);

		// Assert
		Assert.Equal(0, remaining);
	}

	[Fact]
	public void ResetCounter_AfterIncrements_ResetsToZero()
	{
		// Arrange
		const string apiName = "TestApi";
		Sut.TryIncrementRequestCount(apiName);
		Sut.TryIncrementRequestCount(apiName);

		// Act
		Sut.ResetCounter(apiName);

		// Assert
		Assert.Equal(0, Sut.GetRequestCount(apiName));
	}

	[Fact]
	public void GetTimeUntilReset_ReturnsPositiveTimeSpan()
	{
		// Act
		TimeSpan timeUntilReset = Sut.GetTimeUntilReset();

		// Assert
		Assert.True(timeUntilReset.TotalSeconds > 0);
		Assert.True(timeUntilReset.TotalHours <= 24);
	}

	[Fact]
	public void MultipleApis_TrackedSeparately()
	{
		// Arrange
		const string api1 = "Api1";
		const string api2 = "Api2";

		// Act
		Sut.TryIncrementRequestCount(api1);
		Sut.TryIncrementRequestCount(api1);
		Sut.TryIncrementRequestCount(api2);

		// Assert
		Assert.Equal(2, Sut.GetRequestCount(api1));
		Assert.Equal(1, Sut.GetRequestCount(api2));
	}

	[Fact]
	public void CanMakeRequest_WithNullApiName_ThrowsException()
	{
		// Arrange & Act & Assert
		Assert.Throws<ArgumentNullException>(() => Sut.CanMakeRequest(null!));
	}

	[Fact]
	public void CanMakeRequest_WithEmptyApiName_ThrowsException()
	{
		// Arrange & Act & Assert
		Assert.Throws<ArgumentException>(() => Sut.CanMakeRequest(string.Empty));
	}

	[Fact]
	public void TryIncrementRequestCount_WithNullApiName_ThrowsException()
	{
		// Arrange & Act & Assert
		Assert.Throws<ArgumentNullException>(() => Sut.TryIncrementRequestCount(null!));
	}

	[Fact]
	public void GetRequestCount_ForNewApi_ReturnsZero()
	{
		// Arrange
		const string apiName = "NeverUsedApi";

		// Act
		int count = Sut.GetRequestCount(apiName);

		// Assert
		Assert.Equal(0, count);
	}

	[Fact]
	public void GetRemainingQuota_ForNewApi_ReturnsFullLimit()
	{
		// Arrange
		const string apiName = "NeverUsedApi";

		// Act
		int remaining = Sut.GetRemainingQuota(apiName);

		// Assert
		Assert.Equal(Options.DailyCallLimit, remaining);
	}
}
