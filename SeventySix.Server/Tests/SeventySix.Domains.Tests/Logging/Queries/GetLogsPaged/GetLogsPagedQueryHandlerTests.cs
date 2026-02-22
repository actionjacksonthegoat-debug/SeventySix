// <copyright file="GetLogsPagedQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.Logging;
using SeventySix.Shared.POCOs;
using Shouldly;

namespace SeventySix.Domains.Tests.Logging.Queries.GetLogsPaged;

/// <summary>
/// Unit tests for <see cref="GetLogsPagedQueryHandler"/>.
/// </summary>
/// <remarks>
/// Tests the mapping of entities to DTOs and pagination result construction.
/// Uses mocked repository since data access is tested in LogRepositoryTests.
/// </remarks>
public sealed class GetLogsPagedQueryHandlerTests
{
	private readonly ILogRepository Repository;

	/// <summary>
	/// Initializes a new instance of the <see cref="GetLogsPagedQueryHandlerTests"/> class.
	/// </summary>
	public GetLogsPagedQueryHandlerTests()
	{
		Repository =
			Substitute.For<ILogRepository>();
	}

	/// <summary>
	/// Tests that logs are correctly mapped to DTOs in the result.
	/// </summary>
	[Fact]
	public async Task HandleAsync_WithLogs_ReturnsMappedDtosAsync()
	{
		// Arrange
		DateTimeOffset createDate =
			new(2024, 1, 15, 10, 30, 0, TimeSpan.Zero);

		List<Log> logs =
			[
				new()
				{
					Id = 1,
					LogLevel = "Error",
					Message = "Test error",
					CreateDate = createDate,
					MachineName = "Server1",
					Environment = "Production",
				},
				new()
				{
					Id = 2,
					LogLevel = "Warning",
					Message = "Test warning",
					CreateDate = createDate.AddMinutes(5),
					MachineName = "Server2",
					Environment = "Production",
				},
			];

		LogQueryRequest queryRequest =
			new() { Page = 1, PageSize = 10 };

		GetLogsPagedQuery query =
			new(queryRequest);

		Repository
			.GetPagedAsync(
				Arg.Any<LogQueryRequest>(),
				Arg.Any<CancellationToken>())
			.Returns((logs, 2));

		// Act
		PagedResult<LogDto> result =
			await GetLogsPagedQueryHandler.HandleAsync(
				query,
				Repository,
				CancellationToken.None);

		// Assert
		result.Items.Count.ShouldBe(2);
		result.TotalCount.ShouldBe(2);

		LogDto firstDto =
			result.Items[0];
		firstDto.Id.ShouldBe(1);
		firstDto.LogLevel.ShouldBe("Error");
		firstDto.Message.ShouldBe("Test error");
		firstDto.MachineName.ShouldBe("Server1");

		LogDto secondDto =
			result.Items[1];
		secondDto.Id.ShouldBe(2);
		secondDto.LogLevel.ShouldBe("Warning");
	}

	/// <summary>
	/// Tests that empty result returns correct pagination metadata.
	/// </summary>
	[Fact]
	public async Task HandleAsync_NoLogs_ReturnsEmptyResultAsync()
	{
		// Arrange
		LogQueryRequest queryRequest =
			new() { Page = 1, PageSize = 10 };

		GetLogsPagedQuery query =
			new(queryRequest);

		Repository
			.GetPagedAsync(
				Arg.Any<LogQueryRequest>(),
				Arg.Any<CancellationToken>())
			.Returns(([], 0));

		// Act
		PagedResult<LogDto> result =
			await GetLogsPagedQueryHandler.HandleAsync(
				query,
				Repository,
				CancellationToken.None);

		// Assert
		result.Items.ShouldBeEmpty();
		result.TotalCount.ShouldBe(0);
		result.Page.ShouldBe(1);
		result.PageSize.ShouldBe(10);
	}

	/// <summary>
	/// Tests that pagination parameters are preserved in result.
	/// </summary>
	[Fact]
	public async Task HandleAsync_PreservesPaginationMetadataAsync()
	{
		// Arrange
		LogQueryRequest queryRequest =
			new() { Page = 3, PageSize = 25 };

		GetLogsPagedQuery query =
			new(queryRequest);

		Repository
			.GetPagedAsync(
				Arg.Any<LogQueryRequest>(),
				Arg.Any<CancellationToken>())
			.Returns(([], 100));

		// Act
		PagedResult<LogDto> result =
			await GetLogsPagedQueryHandler.HandleAsync(
				query,
				Repository,
				CancellationToken.None);

		// Assert
		result.Page.ShouldBe(3);
		result.PageSize.ShouldBe(25);
		result.TotalCount.ShouldBe(100);
	}

	/// <summary>
	/// Tests that request is passed to repository correctly.
	/// </summary>
	[Fact]
	public async Task HandleAsync_PassesRequestToRepositoryAsync()
	{
		// Arrange
		LogQueryRequest queryRequest =
			new()
			{
				Page = 2,
				PageSize = 50,
				LogLevel = "Error",
			};

		GetLogsPagedQuery query =
			new(queryRequest);

		Repository
			.GetPagedAsync(
				Arg.Any<LogQueryRequest>(),
				Arg.Any<CancellationToken>())
			.Returns(([], 0));

		// Act
		await GetLogsPagedQueryHandler.HandleAsync(
			query,
			Repository,
			CancellationToken.None);

		// Assert
		await Repository
			.Received(1)
			.GetPagedAsync(
				Arg.Is<LogQueryRequest>(
					request =>
						request.Page == 2
							&& request.PageSize == 50
							&& request.LogLevel == "Error"),
				Arg.Any<CancellationToken>());
	}
}