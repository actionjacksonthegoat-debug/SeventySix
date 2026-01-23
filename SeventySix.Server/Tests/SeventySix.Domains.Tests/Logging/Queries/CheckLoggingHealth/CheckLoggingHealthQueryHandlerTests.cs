// <copyright file="CheckLoggingHealthQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using NSubstitute.ExceptionExtensions;
using SeventySix.Logging;
using Shouldly;

namespace SeventySix.Domains.Tests.Logging.Queries.CheckLoggingHealth;

/// <summary>
/// Unit tests for <see cref="CheckLoggingHealthQueryHandler"/>.
/// </summary>
/// <remarks>
/// Tests the health check logic including exception handling.
/// Uses mocked repository since actual database connectivity is tested elsewhere.
/// </remarks>
public class CheckLoggingHealthQueryHandlerTests
{
	private readonly ILogRepository Repository;

	/// <summary>
	/// Initializes a new instance of the <see cref="CheckLoggingHealthQueryHandlerTests"/> class.
	/// </summary>
	public CheckLoggingHealthQueryHandlerTests()
	{
		Repository =
			Substitute.For<ILogRepository>();
	}

	/// <summary>
	/// Tests that successful repository call returns true.
	/// </summary>
	[Fact]
	public async Task HandleAsync_HealthyDatabase_ReturnsTrueAsync()
	{
		// Arrange
		CheckLoggingHealthQuery query =
			new();

		Repository
			.GetPagedAsync(
				Arg.Any<LogQueryRequest>(),
				Arg.Any<CancellationToken>())
			.Returns(([], 0));

		// Act
		bool result =
			await CheckLoggingHealthQueryHandler.HandleAsync(
				query,
				Repository,
				CancellationToken.None);

		// Assert
		result.ShouldBeTrue();
	}

	/// <summary>
	/// Tests that repository exception returns false.
	/// </summary>
	[Fact]
	public async Task HandleAsync_DatabaseException_ReturnsFalseAsync()
	{
		// Arrange
		CheckLoggingHealthQuery query =
			new();

		Repository
			.GetPagedAsync(
				Arg.Any<LogQueryRequest>(),
				Arg.Any<CancellationToken>())
			.ThrowsAsync(
				new InvalidOperationException("Database unavailable"));

		// Act
		bool result =
			await CheckLoggingHealthQueryHandler.HandleAsync(
				query,
				Repository,
				CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}

	/// <summary>
	/// Tests that minimal query is used for health check.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UsesMinimalQueryAsync()
	{
		// Arrange
		CheckLoggingHealthQuery query =
			new();

		Repository
			.GetPagedAsync(
				Arg.Any<LogQueryRequest>(),
				Arg.Any<CancellationToken>())
			.Returns(([], 0));

		// Act
		await CheckLoggingHealthQueryHandler.HandleAsync(
			query,
			Repository,
			CancellationToken.None);

		// Assert
		await Repository
			.Received(1)
			.GetPagedAsync(
				Arg.Is<LogQueryRequest>(
					request =>
						request.Page == 1
							&& request.PageSize == 1),
				Arg.Any<CancellationToken>());
	}
}
