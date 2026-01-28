// <copyright file="ThirdPartyApiRequestsControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Api.Controllers;
using SeventySix.ApiTracking;
using SeventySix.Shared.Constants;
using Shouldly;
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
		Controller =
			new ThirdPartyApiRequestsController(MessageBus);
	}

	[Fact]
	public async Task GetAll_ReturnsOkResult_WithListOfApiRequestsAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		List<ThirdPartyApiRequestDto> expectedRequests =
			[
			new ThirdPartyApiRequestDto
			{
				Id = 1,
				ApiName =
					ExternalApiConstants.BrevoEmail,
				BaseUrl = "smtp-relay.brevo.com",
				CallCount = 150,
				LastCalledAt =
					timeProvider
					.GetUtcNow()
					.UtcDateTime.AddMinutes(-5),
				ResetDate =
					DateOnly.FromDateTime(
					timeProvider.GetUtcNow().UtcDateTime.AddDays(1)),
			},
			new ThirdPartyApiRequestDto
			{
				Id = 2,
				ApiName = "GoogleMaps",
				BaseUrl = "https://maps.googleapis.com",
				CallCount = 75,
				LastCalledAt =
					timeProvider
					.GetUtcNow()
					.UtcDateTime.AddMinutes(-10),
				ResetDate =
					DateOnly.FromDateTime(
					timeProvider.GetUtcNow().UtcDateTime.AddDays(1)),
			},
		];

		MessageBus
			.InvokeAsync<IEnumerable<ThirdPartyApiRequestDto>>(
				Arg.Any<GetAllApiRequestsQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(expectedRequests);

		// Act
		ActionResult<IEnumerable<ThirdPartyApiRequestDto>> result =
			await Controller.GetAllAsync(CancellationToken.None);

		// Assert
		OkObjectResult okResult =
			result.Result.ShouldBeOfType<OkObjectResult>();
		IEnumerable<ThirdPartyApiRequestDto> returnedRequests =
			okResult.Value.ShouldBeAssignableTo<IEnumerable<ThirdPartyApiRequestDto>>()!;
		returnedRequests.Count().ShouldBe(2);

		await MessageBus
			.Received(1)
			.InvokeAsync<IEnumerable<ThirdPartyApiRequestDto>>(
				Arg.Any<GetAllApiRequestsQuery>(),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task GetAll_ReturnsEmptyList_WhenNoApiRequestsAsync()
	{
		// Arrange
		MessageBus
			.InvokeAsync<IEnumerable<ThirdPartyApiRequestDto>>(
				Arg.Any<GetAllApiRequestsQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(Enumerable.Empty<ThirdPartyApiRequestDto>());

		// Act
		ActionResult<IEnumerable<ThirdPartyApiRequestDto>> result =
			await Controller.GetAllAsync(CancellationToken.None);

		// Assert
		OkObjectResult okResult =
			result.Result.ShouldBeOfType<OkObjectResult>();
		IEnumerable<ThirdPartyApiRequestDto> returnedRequests =
			okResult.Value.ShouldBeAssignableTo<IEnumerable<ThirdPartyApiRequestDto>>()!;
		returnedRequests.ShouldBeEmpty();
	}

	[Fact]
	public async Task GetStatistics_ReturnsOkResult_WithStatisticsAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		ThirdPartyApiStatisticsDto expectedStats =
			new()
			{
				TotalCallsToday = 225,
				TotalApisTracked = 2,
				CallsByApi =
					new Dictionary<string, int>
					{
						{ ExternalApiConstants.BrevoEmail, 150 },
						{ "GoogleMaps", 75 },
					},
				LastCalledByApi =
					new Dictionary<string, DateTime?>
					{
						{
							ExternalApiConstants.BrevoEmail,
							timeProvider.GetUtcNow().UtcDateTime.AddMinutes(-5)
						},
						{
							"GoogleMaps",
							timeProvider.GetUtcNow().UtcDateTime.AddMinutes(-10)
						},
					},
			};

		MessageBus
			.InvokeAsync<ThirdPartyApiStatisticsDto>(
				Arg.Any<GetApiRequestStatisticsQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(expectedStats);

		// Act
		ActionResult<ThirdPartyApiStatisticsDto> result =
			await Controller.GetStatisticsAsync(CancellationToken.None);

		// Assert
		OkObjectResult okResult =
			result.Result.ShouldBeOfType<OkObjectResult>();
		ThirdPartyApiStatisticsDto returnedStats =
			okResult.Value.ShouldBeOfType<ThirdPartyApiStatisticsDto>();
		returnedStats.TotalCallsToday.ShouldBe(225);
		returnedStats.TotalApisTracked.ShouldBe(2);
		returnedStats.CallsByApi.Count.ShouldBe(2);

		await MessageBus
			.Received(1)
			.InvokeAsync<ThirdPartyApiStatisticsDto>(
				Arg.Any<GetApiRequestStatisticsQuery>(),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task GetStatistics_ReturnsEmptyStatistics_WhenNoDataAsync()
	{
		// Arrange
		ThirdPartyApiStatisticsDto expectedStats =
			new()
			{
				TotalCallsToday = 0,
				TotalApisTracked = 0,
				CallsByApi = [],
				LastCalledByApi = [],
			};

		MessageBus
			.InvokeAsync<ThirdPartyApiStatisticsDto>(
				Arg.Any<GetApiRequestStatisticsQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(expectedStats);

		// Act
		ActionResult<ThirdPartyApiStatisticsDto> result =
			await Controller.GetStatisticsAsync(CancellationToken.None);

		// Assert
		OkObjectResult okResult =
			result.Result.ShouldBeOfType<OkObjectResult>();
		ThirdPartyApiStatisticsDto returnedStats =
			okResult.Value.ShouldBeOfType<ThirdPartyApiStatisticsDto>();
		returnedStats.TotalCallsToday.ShouldBe(0);
		returnedStats.CallsByApi.ShouldBeEmpty();
	}
}