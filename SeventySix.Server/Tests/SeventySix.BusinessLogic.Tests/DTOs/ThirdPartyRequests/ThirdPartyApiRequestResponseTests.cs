// <copyright file="ThirdPartyApiRequestResponseTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.BusinessLogic.DTOs.ThirdPartyRequests;

namespace SeventySix.Core.Tests.DTOs.ThirdPartyRequests;

/// <summary>
/// Unit tests for <see cref="ThirdPartyApiRequestResponse"/>.
/// </summary>
public class ThirdPartyApiRequestResponseTests
{
	[Fact]
	public void Constructor_ShouldInitializeWithDefaultValues()
	{
		// Arrange & Act
		ThirdPartyApiRequestResponse response = new();

		// Assert
		Assert.Equal(0, response.Id);
		Assert.Equal(string.Empty, response.ApiName);
		Assert.Equal(string.Empty, response.BaseUrl);
		Assert.Equal(0, response.CallCount);
		Assert.Null(response.LastCalledAt);
		Assert.Equal(default(DateOnly), response.ResetDate);
	}

	[Fact]
	public void Properties_ShouldSetAndGetCorrectly()
	{
		// Arrange
		DateTime now = DateTime.UtcNow;
		DateOnly resetDate = DateOnly.FromDateTime(now);
		ThirdPartyApiRequestResponse response = new()
		{
			Id = 42,
			ApiName = "ExternalAPI",
			BaseUrl = "https://api.ExternalAPImap.org",
			CallCount = 150,
			LastCalledAt = now,
			ResetDate = resetDate,
		};

		// Assert
		Assert.Equal(42, response.Id);
		Assert.Equal("ExternalAPI", response.ApiName);
		Assert.Equal("https://api.ExternalAPImap.org", response.BaseUrl);
		Assert.Equal(150, response.CallCount);
		Assert.Equal(now, response.LastCalledAt);
		Assert.Equal(resetDate, response.ResetDate);
	}

	[Fact]
	public void LastCalledAt_ShouldAllowNull()
	{
		// Arrange
		ThirdPartyApiRequestResponse response = new()
		{
			ApiName = "TestApi",
			BaseUrl = "https://test.api",
			LastCalledAt = null,
		};

		// Assert
		Assert.Null(response.LastCalledAt);
	}
}