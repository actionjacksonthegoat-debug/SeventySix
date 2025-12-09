// <copyright file="ThirdPartyApiRequestsControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using SeventySix.Api.Controllers;
using SeventySix.ApiTracking;
using Wolverine;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Unit tests for ThirdPartyApiRequestsController using Wolverine IMessageBus.
/// </summary>
public class ThirdPartyApiRequestsControllerTests
{
	private readonly IMessageBus MessageBus;
	private readonly ThirdPartyApiRequestsController Controller;

	public ThirdPartyApiRequestsControllerTests()
	{
		MessageBus = Substitute.For<IMessageBus>();
		Controller = new ThirdPartyApiRequestsController(MessageBus);
	}

	[Fact]
	public async Task GetAll_ReturnsOkResult_WithListOfApiRequestsAsync()
	{
		// Arrange
		List<ThirdPartyApiRequestResponse> expectedRequests =
			[
				new ThirdPartyApiRequestResponse
				{
					Id = 1,
					ApiName = ExternalApiConstants.BrevoEmail,
					BaseUrl = "smtp-relay.brevo.com",
					CallCount = 150,
					LastCalledAt = DateTime.UtcNow.AddMinutes(-5),
					ResetDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
				},
				new ThirdPartyApiRequestResponse
				{
					Id = 2,
					ApiName = "GoogleMaps",
					BaseUrl = "https://maps.googleapis.com",
					CallCount = 75,
					LastCalledAt = DateTime.UtcNow.AddMinutes(-10),
					ResetDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
				},
			];

		MessageBus.InvokeAsync<IEnumerable<ThirdPartyApiRequestResponse>>(
				Arg.Any<GetAllApiRequestsQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(expectedRequests);

		// Act
		ActionResult<IEnumerable<ThirdPartyApiRequestResponse>> result =
			await Controller.GetAllAsync(CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		IEnumerable<ThirdPartyApiRequestResponse> returnedRequests =
			Assert.IsAssignableFrom<IEnumerable<ThirdPartyApiRequestResponse>>(okResult.Value);
		Assert.Equal(2, returnedRequests.Count());

		await MessageBus.Received(1)
			.InvokeAsync<IEnumerable<ThirdPartyApiRequestResponse>>(
				Arg.Any<GetAllApiRequestsQuery>(),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task GetAll_ReturnsEmptyList_WhenNoApiRequestsAsync()
	{
		// Arrange
		MessageBus.InvokeAsync<IEnumerable<ThirdPartyApiRequestResponse>>(
				Arg.Any<GetAllApiRequestsQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(Enumerable.Empty<ThirdPartyApiRequestResponse>());

		// Act
		ActionResult<IEnumerable<ThirdPartyApiRequestResponse>> result =
			await Controller.GetAllAsync(CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		IEnumerable<ThirdPartyApiRequestResponse> returnedRequests =
			Assert.IsAssignableFrom<IEnumerable<ThirdPartyApiRequestResponse>>(okResult.Value);
		Assert.Empty(returnedRequests);
	}

	[Fact]
	public async Task GetStatistics_ReturnsOkResult_WithStatisticsAsync()
	{
		// Arrange
		ThirdPartyApiStatisticsResponse expectedStats =
			new()
			{
				TotalCallsToday = 225,
				TotalApisTracked = 2,
				CallsByApi = new Dictionary<string, int>
				{
					{ ExternalApiConstants.BrevoEmail, 150 },
					{ "GoogleMaps", 75 },
				},
				LastCalledByApi = new Dictionary<string, DateTime?>
				{
					{ ExternalApiConstants.BrevoEmail, DateTime.UtcNow.AddMinutes(-5) },
					{ "GoogleMaps", DateTime.UtcNow.AddMinutes(-10) },
				},
			};

		MessageBus.InvokeAsync<ThirdPartyApiStatisticsResponse>(
				Arg.Any<GetApiRequestStatisticsQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(expectedStats);

		// Act
		ActionResult<ThirdPartyApiStatisticsResponse> result =
			await Controller.GetStatisticsAsync(CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		ThirdPartyApiStatisticsResponse returnedStats =
			Assert.IsType<ThirdPartyApiStatisticsResponse>(okResult.Value);
		Assert.Equal(225, returnedStats.TotalCallsToday);
		Assert.Equal(2, returnedStats.TotalApisTracked);
		Assert.Equal(2, returnedStats.CallsByApi.Count);

		await MessageBus.Received(1)
			.InvokeAsync<ThirdPartyApiStatisticsResponse>(
				Arg.Any<GetApiRequestStatisticsQuery>(),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task GetStatistics_ReturnsEmptyStatistics_WhenNoDataAsync()
	{
		// Arrange
		ThirdPartyApiStatisticsResponse expectedStats =
			new()
			{
				TotalCallsToday = 0,
				TotalApisTracked = 0,
				CallsByApi = [],
				LastCalledByApi = [],
			};

		MessageBus.InvokeAsync<ThirdPartyApiStatisticsResponse>(
				Arg.Any<GetApiRequestStatisticsQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(expectedStats);

		// Act
		ActionResult<ThirdPartyApiStatisticsResponse> result =
			await Controller.GetStatisticsAsync(CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		ThirdPartyApiStatisticsResponse returnedStats =
			Assert.IsType<ThirdPartyApiStatisticsResponse>(okResult.Value);
		Assert.Equal(0, returnedStats.TotalCallsToday);
		Assert.Empty(returnedStats.CallsByApi);
	}
}
