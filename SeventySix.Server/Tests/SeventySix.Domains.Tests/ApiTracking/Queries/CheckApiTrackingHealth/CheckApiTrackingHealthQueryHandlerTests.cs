// <copyright file="CheckApiTrackingHealthQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using NSubstitute.ExceptionExtensions;
using SeventySix.ApiTracking;
using Shouldly;

namespace SeventySix.Domains.Tests.ApiTracking.Queries.CheckApiTrackingHealth;

/// <summary>
/// Unit tests for <see cref="CheckApiTrackingHealthQueryHandler"/>.
/// </summary>
/// <remarks>
/// Tests the health check logic including exception handling.
/// Uses mocked repository since actual database connectivity is tested elsewhere.
/// </remarks>
public class CheckApiTrackingHealthQueryHandlerTests
{
	private readonly IThirdPartyApiRequestRepository Repository;

	/// <summary>
	/// Initializes a new instance of the <see cref="CheckApiTrackingHealthQueryHandlerTests"/> class.
	/// </summary>
	public CheckApiTrackingHealthQueryHandlerTests()
	{
		Repository =
			Substitute.For<IThirdPartyApiRequestRepository>();
	}

	/// <summary>
	/// Tests that successful repository call returns true.
	/// </summary>
	[Fact]
	public async Task HandleAsync_HealthyDatabase_ReturnsTrueAsync()
	{
		// Arrange
		CheckApiTrackingHealthQuery query =
			new();

		Repository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns([]);

		// Act
		bool result =
			await CheckApiTrackingHealthQueryHandler.HandleAsync(
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
		CheckApiTrackingHealthQuery query =
			new();

		Repository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.ThrowsAsync(
				new InvalidOperationException("Database unavailable"));

		// Act
		bool result =
			await CheckApiTrackingHealthQueryHandler.HandleAsync(
				query,
				Repository,
				CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}

	/// <summary>
	/// Tests that repository is called exactly once.
	/// </summary>
	[Fact]
	public async Task HandleAsync_CallsRepositoryOnceAsync()
	{
		// Arrange
		CheckApiTrackingHealthQuery query =
			new();

		Repository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns([]);

		// Act
		await CheckApiTrackingHealthQueryHandler.HandleAsync(
			query,
			Repository,
			CancellationToken.None);

		// Assert
		await Repository
			.Received(1)
			.GetAllAsync(Arg.Any<CancellationToken>());
	}
}
