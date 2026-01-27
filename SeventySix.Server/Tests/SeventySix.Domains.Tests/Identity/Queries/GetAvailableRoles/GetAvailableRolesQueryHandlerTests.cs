// <copyright file="GetAvailableRolesQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.Identity;
using SeventySix.Identity.Constants;
using SeventySix.Identity.Queries.GetAvailableRoles;
using SeventySix.Shared.Constants;
using SeventySix.TestUtilities.Testing;
using Shouldly;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Domains.Tests.Identity.Queries.GetAvailableRoles;

/// <summary>
/// Unit tests for <see cref="GetAvailableRolesQueryHandler"/>.
/// Tests query handler with mocked dependencies following 80/20 rule.
/// </summary>
public class GetAvailableRolesQueryHandlerTests
{
	private readonly IPermissionRequestRepository Repository;
	private readonly IFusionCacheProvider CacheProvider;
	private readonly IFusionCache Cache;

	/// <summary>
	/// Initializes a new instance of the <see cref="GetAvailableRolesQueryHandlerTests"/> class.
	/// </summary>
	public GetAvailableRolesQueryHandlerTests()
	{
		Repository =
			Substitute.For<IPermissionRequestRepository>();
		Cache =
			TestCacheFactory.CreateIdentityCache();
		CacheProvider =
			Substitute.For<IFusionCacheProvider>();
		CacheProvider
			.GetCache(CacheNames.Identity)
			.Returns(Cache);
	}

	/// <summary>
	/// Tests that all requestable roles are returned when user has no roles or pending requests.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserWithNoRolesOrRequests_ReturnsAllRequestableRolesAsync()
	{
		// Arrange
		const long userId = 42;

		Repository
			.GetUserExistingRolesAsync(
				userId,
				Arg.Any<CancellationToken>())
			.Returns([]);

		Repository
			.GetByUserIdAsync(
				userId,
				Arg.Any<CancellationToken>())
			.Returns([]);

		GetAvailableRolesQuery query =
			new(userId);

		// Act
		IEnumerable<AvailableRoleDto> result =
			await GetAvailableRolesQueryHandler.HandleAsync(
				query,
				Repository,
				CacheProvider,
				CancellationToken.None);

		// Assert
		List<AvailableRoleDto> resultList =
			result.ToList();
		resultList.Count.ShouldBe(RoleConstants.AllRequestableRoles.Count);
		resultList.ShouldContain(
			role => role.Name == RoleConstants.Developer);
		resultList.ShouldContain(
			role => role.Name == RoleConstants.Admin);
	}

	/// <summary>
	/// Tests that roles user already has are excluded from available roles.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserWithExistingRole_ExcludesExistingRoleAsync()
	{
		// Arrange
		const long userId = 42;

		Repository
			.GetUserExistingRolesAsync(
				userId,
				Arg.Any<CancellationToken>())
			.Returns([RoleConstants.Developer]);

		Repository
			.GetByUserIdAsync(
				userId,
				Arg.Any<CancellationToken>())
			.Returns([]);

		GetAvailableRolesQuery query =
			new(userId);

		// Act
		IEnumerable<AvailableRoleDto> result =
			await GetAvailableRolesQueryHandler.HandleAsync(
				query,
				Repository,
				CacheProvider,
				CancellationToken.None);

		// Assert
		List<AvailableRoleDto> resultList =
			result.ToList();
		resultList.ShouldNotContain(
			role => role.Name == RoleConstants.Developer);
		resultList.ShouldContain(
			role => role.Name == RoleConstants.Admin);
	}

	/// <summary>
	/// Tests that roles with pending requests are excluded from available roles.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserWithPendingRequest_ExcludesPendingRoleAsync()
	{
		// Arrange
		const long userId = 42;

		Repository
			.GetUserExistingRolesAsync(
				userId,
				Arg.Any<CancellationToken>())
			.Returns([]);

		PermissionRequest pendingRequest =
			new()
			{
				RequestedRole =
					new ApplicationRole
					{
						Name = RoleConstants.Admin,
					},
			};

		Repository
			.GetByUserIdAsync(
				userId,
				Arg.Any<CancellationToken>())
			.Returns([pendingRequest]);

		GetAvailableRolesQuery query =
			new(userId);

		// Act
		IEnumerable<AvailableRoleDto> result =
			await GetAvailableRolesQueryHandler.HandleAsync(
				query,
				Repository,
				CacheProvider,
				CancellationToken.None);

		// Assert
		List<AvailableRoleDto> resultList =
			result.ToList();
		resultList.ShouldNotContain(
			role => role.Name == RoleConstants.Admin);
		resultList.ShouldContain(
			role => role.Name == RoleConstants.Developer);
	}

	/// <summary>
	/// Tests that user with all roles returns empty collection.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserWithAllRoles_ReturnsEmptyCollectionAsync()
	{
		// Arrange
		const long userId = 42;

		List<string> allRoleNames =
			RoleConstants.AllRequestableRoles
				.Select(role => role.Name)
				.ToList();

		Repository
			.GetUserExistingRolesAsync(
				userId,
				Arg.Any<CancellationToken>())
			.Returns(allRoleNames);

		Repository
			.GetByUserIdAsync(
				userId,
				Arg.Any<CancellationToken>())
			.Returns([]);

		GetAvailableRolesQuery query =
			new(userId);

		// Act
		IEnumerable<AvailableRoleDto> result =
			await GetAvailableRolesQueryHandler.HandleAsync(
				query,
				Repository,
				CacheProvider,
				CancellationToken.None);

		// Assert
		result.ShouldBeEmpty();
	}

	/// <summary>
	/// Tests that cache is used for subsequent requests.
	/// </summary>
	[Fact]
	public async Task HandleAsync_CalledTwice_UsesCacheOnSecondCallAsync()
	{
		// Arrange
		const long userId = 42;

		Repository
			.GetUserExistingRolesAsync(
				userId,
				Arg.Any<CancellationToken>())
			.Returns([]);

		Repository
			.GetByUserIdAsync(
				userId,
				Arg.Any<CancellationToken>())
			.Returns([]);

		GetAvailableRolesQuery query =
			new(userId);

		// Act - First call populates cache
		IEnumerable<AvailableRoleDto> firstResult =
			await GetAvailableRolesQueryHandler.HandleAsync(
				query,
				Repository,
				CacheProvider,
				CancellationToken.None);

		// Second call should use cache
		IEnumerable<AvailableRoleDto> secondResult =
			await GetAvailableRolesQueryHandler.HandleAsync(
				query,
				Repository,
				CacheProvider,
				CancellationToken.None);

		// Assert
		firstResult.Count().ShouldBe(RoleConstants.AllRequestableRoles.Count);
		secondResult.Count().ShouldBe(RoleConstants.AllRequestableRoles.Count);

		// Repository should only be called once (second call uses cache)
		await Repository
			.Received(1)
			.GetUserExistingRolesAsync(
				userId,
				Arg.Any<CancellationToken>());
	}
}