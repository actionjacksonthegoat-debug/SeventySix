// <copyright file="ThirdPartyApiRequestDtoTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;
using SeventySix.ApiTracking;

namespace SeventySix.Domains.Tests.ApiTracking.POCOs.DTOs;

/// <summary>
/// Unit tests for <see cref="ThirdPartyApiRequestDto"/>.
/// </summary>
public class ThirdPartyApiRequestDtoTests
{
	[Fact]
	public void Constructor_ShouldInitializeWithDefaultValues()
	{
		// Arrange & Act
		ThirdPartyApiRequestDto dto = new();

		// Assert
		Assert.Equal(0, dto.Id);
		Assert.Equal(string.Empty, dto.ApiName);
		Assert.Equal(string.Empty, dto.BaseUrl);
		Assert.Equal(0, dto.CallCount);
		Assert.Null(dto.LastCalledAt);
		Assert.Equal(default(DateOnly), dto.ResetDate);
	}

	[Fact]
	public void Properties_ShouldSetAndGetCorrectly()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;
		DateOnly resetDate =
			DateOnly.FromDateTime(now);
		ThirdPartyApiRequestDto dto =
			new()
			{
				Id = 42,
				ApiName = "ExternalAPI",
				BaseUrl = "https://api.ExternalAPImap.org",
				CallCount = 150,
				LastCalledAt = now,
				ResetDate = resetDate,
			};

		// Assert
		Assert.Equal(42, dto.Id);
		Assert.Equal("ExternalAPI", dto.ApiName);
		Assert.Equal("https://api.ExternalAPImap.org", dto.BaseUrl);
		Assert.Equal(150, dto.CallCount);
		Assert.Equal(now, dto.LastCalledAt);
		Assert.Equal(resetDate, dto.ResetDate);
	}

	[Fact]
	public void LastCalledAt_ShouldAllowNull()
	{
		// Arrange
		ThirdPartyApiRequestDto dto =
			new()
			{
				ApiName = "TestApi",
				BaseUrl = "https://test.api",
				LastCalledAt = null,
			};

		// Assert
		Assert.Null(dto.LastCalledAt);
	}
}
