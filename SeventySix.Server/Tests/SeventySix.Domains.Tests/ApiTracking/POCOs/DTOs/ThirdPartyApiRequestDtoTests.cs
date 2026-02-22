// <copyright file="ThirdPartyApiRequestDtoTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;
using SeventySix.ApiTracking;
using Shouldly;

namespace SeventySix.Domains.Tests.ApiTracking.POCOs.DTOs;

/// <summary>
/// Unit tests for <see cref="ThirdPartyApiRequestDto"/>.
/// </summary>
public sealed class ThirdPartyApiRequestDtoTests
{
	[Fact]
	public void Constructor_ShouldInitializeWithDefaultValues()
	{
		// Arrange & Act
		ThirdPartyApiRequestDto dto = new();

		// Assert
		dto.Id.ShouldBe(0);
		dto.ApiName.ShouldBe(string.Empty);
		dto.BaseUrl.ShouldBe(string.Empty);
		dto.CallCount.ShouldBe(0);
		dto.LastCalledAt.ShouldBeNull();
		dto.ResetDate.ShouldBe(default(DateOnly));
	}

	[Fact]
	public void Properties_ShouldSetAndGetCorrectly()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		DateTimeOffset now =
			timeProvider.GetUtcNow();
		DateOnly resetDate =
			DateOnly.FromDateTime(now.UtcDateTime);
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
		dto.Id.ShouldBe(42);
		dto.ApiName.ShouldBe("ExternalAPI");
		dto.BaseUrl.ShouldBe(
			"https://api.ExternalAPImap.org");
		dto.CallCount.ShouldBe(150);
		dto.LastCalledAt.ShouldBe(now);
		dto.ResetDate.ShouldBe(resetDate);
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
		dto.LastCalledAt.ShouldBeNull();
	}
}