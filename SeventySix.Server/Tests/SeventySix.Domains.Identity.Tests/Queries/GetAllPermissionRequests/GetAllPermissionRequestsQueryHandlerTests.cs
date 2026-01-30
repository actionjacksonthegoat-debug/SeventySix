// <copyright file="GetAllPermissionRequestsQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Identity.Queries.GetAllPermissionRequests;
using SeventySix.Shared.Constants;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Testing;
using Shouldly;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Identity.Tests.Queries.GetAllPermissionRequests;

/// <summary>
/// Unit tests for <see cref="GetAllPermissionRequestsQueryHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on repository delegation.
/// </remarks>
public class GetAllPermissionRequestsQueryHandlerTests
{
	private static readonly FakeTimeProvider TimeProvider =
		new(TestTimeProviderBuilder.DefaultTime);

	private readonly IPermissionRequestRepository Repository;
	private readonly IFusionCacheProvider CacheProvider;
	private readonly IFusionCache IdentityCache;

	/// <summary>
	/// Initializes a new instance of the <see cref="GetAllPermissionRequestsQueryHandlerTests"/> class.
	/// </summary>
	public GetAllPermissionRequestsQueryHandlerTests()
	{
		Repository =
			Substitute.For<IPermissionRequestRepository>();
		CacheProvider =
			Substitute.For<IFusionCacheProvider>();
		IdentityCache =
			TestCacheFactory.CreateIdentityCache();
		CacheProvider
			.GetCache(CacheNames.Identity)
			.Returns(IdentityCache);
	}

	/// <summary>
	/// Tests that empty collection is returned when no requests exist.
	/// </summary>
	[Fact]
	public async Task HandleAsync_NoRequests_ReturnsEmptyCollectionAsync()
	{
		// Arrange
		GetAllPermissionRequestsQuery query =
			new();

		Repository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns([]);

		// Act
		IEnumerable<PermissionRequestDto> result =
			await GetAllPermissionRequestsQueryHandler.HandleAsync(
				query,
				Repository,
				CacheProvider,
				CancellationToken.None);

		// Assert
		result.ShouldBeEmpty();
	}

	/// <summary>
	/// Tests that requests are returned from repository.
	/// </summary>
	[Fact]
	public async Task HandleAsync_RequestsExist_ReturnsRequestsAsync()
	{
		// Arrange
		GetAllPermissionRequestsQuery query =
			new();

		List<PermissionRequestDto> requests =
			[
				CreateRequest(1, "user1", "Developer"),
				CreateRequest(2, "user2", "Admin"),
			];

		Repository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns(requests);

		// Act
		IEnumerable<PermissionRequestDto> result =
			await GetAllPermissionRequestsQueryHandler.HandleAsync(
				query,
				Repository,
				CacheProvider,
				CancellationToken.None);

		// Assert
		List<PermissionRequestDto> resultList =
			result.ToList();

		resultList.Count.ShouldBe(2);
	}

	/// <summary>
	/// Tests that cancellation token is passed to repository.
	/// </summary>
	[Fact]
	public async Task HandleAsync_PassesCancellationTokenAsync()
	{
		// Arrange
		using CancellationTokenSource cancellationTokenSource =
			new();

		GetAllPermissionRequestsQuery query =
			new();

		Repository
			.GetAllAsync(cancellationTokenSource.Token)
			.Returns([]);

		// Act
		await GetAllPermissionRequestsQueryHandler.HandleAsync(
			query,
			Repository,
			CacheProvider,
			cancellationTokenSource.Token);

		// Assert
		await Repository
			.Received(1)
			.GetAllAsync(cancellationTokenSource.Token);
	}

	private static PermissionRequestDto CreateRequest(
		long requestId,
		string username,
		string roleName)
	{
		return new PermissionRequestDto(
			Id: requestId,
			UserId: requestId,
			Username: username,
			RequestedRole: roleName,
			RequestMessage: "Please approve",
			CreatedBy: username,
			CreateDate: TimeProvider.GetUtcNow().UtcDateTime);
	}
}