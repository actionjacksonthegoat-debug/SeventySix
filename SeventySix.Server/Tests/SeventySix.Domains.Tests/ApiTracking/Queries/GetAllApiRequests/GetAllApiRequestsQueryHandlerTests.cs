// <copyright file="GetAllApiRequestsQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.ApiTracking;
using Shouldly;

namespace SeventySix.Domains.Tests.ApiTracking.Queries.GetAllApiRequests;

/// <summary>
/// Unit tests for <see cref="GetAllApiRequestsQueryHandler"/>.
/// </summary>
/// <remarks>
/// Tests the mapping of entities to DTOs.
/// Uses mocked repository since data access is tested in repository tests.
/// </remarks>
public class GetAllApiRequestsQueryHandlerTests
{
	private readonly IThirdPartyApiRequestRepository Repository;

	/// <summary>
	/// Initializes a new instance of the <see cref="GetAllApiRequestsQueryHandlerTests"/> class.
	/// </summary>
	public GetAllApiRequestsQueryHandlerTests()
	{
		Repository =
			Substitute.For<IThirdPartyApiRequestRepository>();
	}

	/// <summary>
	/// Tests that requests are correctly mapped to DTOs.
	/// </summary>
	[Fact]
	public async Task HandleAsync_WithRequests_ReturnsMappedDtosAsync()
	{
		// Arrange
		DateTime lastCalled =
			new(2024, 1, 15, 10, 30, 0, DateTimeKind.Utc);
		DateOnly resetDate =
			new(2024, 1, 16);

		List<ThirdPartyApiRequest> requests =
			[
				new()
				{
					Id = 1,
					ApiName = "WeatherApi",
					BaseUrl = "https://api.weather.com",
					CallCount = 100,
					LastCalledAt = lastCalled,
					ResetDate = resetDate,
				},
				new()
				{
					Id = 2,
					ApiName = "MapsApi",
					BaseUrl = "https://api.maps.com",
					CallCount = 50,
					LastCalledAt = lastCalled.AddHours(-1),
					ResetDate = resetDate,
				},
			];

		GetAllApiRequestsQuery query =
			new();

		Repository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns(requests);

		// Act
		IEnumerable<ThirdPartyApiRequestDto> result =
			await GetAllApiRequestsQueryHandler.HandleAsync(
				query,
				Repository,
				CancellationToken.None);

		// Assert
		List<ThirdPartyApiRequestDto> resultList =
			[.. result];
		resultList.Count.ShouldBe(2);

		ThirdPartyApiRequestDto firstDto =
			resultList[0];
		firstDto.Id.ShouldBe(1);
		firstDto.ApiName.ShouldBe("WeatherApi");
		firstDto.BaseUrl.ShouldBe("https://api.weather.com");
		firstDto.CallCount.ShouldBe(100);
		firstDto.LastCalledAt.ShouldBe(lastCalled);
		firstDto.ResetDate.ShouldBe(resetDate);

		ThirdPartyApiRequestDto secondDto =
			resultList[1];
		secondDto.Id.ShouldBe(2);
		secondDto.ApiName.ShouldBe("MapsApi");
	}

	/// <summary>
	/// Tests that empty result is returned when no requests exist.
	/// </summary>
	[Fact]
	public async Task HandleAsync_NoRequests_ReturnsEmptyCollectionAsync()
	{
		// Arrange
		GetAllApiRequestsQuery query =
			new();

		Repository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns([]);

		// Act
		IEnumerable<ThirdPartyApiRequestDto> result =
			await GetAllApiRequestsQueryHandler.HandleAsync(
				query,
				Repository,
				CancellationToken.None);

		// Assert
		result.ShouldBeEmpty();
	}

	/// <summary>
	/// Tests that cancellation token is passed to repository.
	/// </summary>
	[Fact]
	public async Task HandleAsync_PassesCancellationTokenAsync()
	{
		// Arrange
		GetAllApiRequestsQuery query =
			new();

		using CancellationTokenSource cts =
			new();

		Repository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns([]);

		// Act
		await GetAllApiRequestsQueryHandler.HandleAsync(
			query,
			Repository,
			cts.Token);

		// Assert
		await Repository
			.Received(1)
			.GetAllAsync(cts.Token);
	}
}