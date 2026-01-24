// <copyright file="GetUserRolesQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Shared.Constants;
using SeventySix.TestUtilities.Mocks;
using SeventySix.TestUtilities.Testing;
using Shouldly;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Domains.Tests.Identity.Queries.GetUserRoles;

/// <summary>
/// Unit tests for <see cref="GetUserRolesQueryHandler"/>.
/// Tests query handler with mocked dependencies following 80/20 rule.
/// </summary>
public class GetUserRolesQueryHandlerTests
{
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly IFusionCacheProvider CacheProvider;
	private readonly IFusionCache Cache;

	/// <summary>
	/// Initializes a new instance of the <see cref="GetUserRolesQueryHandlerTests"/> class.
	/// </summary>
	public GetUserRolesQueryHandlerTests()
	{
		UserManager =
			IdentityMockFactory.CreateUserManager();
		Cache =
			TestCacheFactory.CreateIdentityCache();
		CacheProvider =
			Substitute.For<IFusionCacheProvider>();
		CacheProvider
			.GetCache(CacheNames.Identity)
			.Returns(Cache);
	}

	/// <summary>
	/// Tests that user roles are returned correctly.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserWithRoles_ReturnsRolesAsync()
	{
		// Arrange
		const long userId = 42;
		ApplicationUser user =
			new()
			{
				Id = userId,
				UserName = "testuser",
				Email = "test@example.com",
			};

		List<string> roles =
			["Admin", "Developer"];

		UserManager
			.FindByIdAsync(userId.ToString())
			.Returns(user);

		UserManager
			.GetRolesAsync(user)
			.Returns(roles);

		GetUserRolesQuery query =
			new(userId);

		// Act
		IEnumerable<string> result =
			await GetUserRolesQueryHandler.HandleAsync(
				query,
				UserManager,
				CacheProvider,
				CancellationToken.None);

		// Assert
		List<string> resultList =
			result.ToList();
		resultList.Count.ShouldBe(2);
		resultList.ShouldContain("Admin");
		resultList.ShouldContain("Developer");
	}

	/// <summary>
	/// Tests that empty collection is returned for user without roles.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserWithNoRoles_ReturnsEmptyCollectionAsync()
	{
		// Arrange
		const long userId = 42;
		ApplicationUser user =
			new()
			{
				Id = userId,
				UserName = "testuser",
				Email = "test@example.com",
			};

		List<string> roles =
			[];

		UserManager
			.FindByIdAsync(userId.ToString())
			.Returns(user);

		UserManager
			.GetRolesAsync(user)
			.Returns(roles);

		GetUserRolesQuery query =
			new(userId);

		// Act
		IEnumerable<string> result =
			await GetUserRolesQueryHandler.HandleAsync(
				query,
				UserManager,
				CacheProvider,
				CancellationToken.None);

		// Assert
		result.ShouldBeEmpty();
	}

	/// <summary>
	/// Tests that non-existing user returns empty collection.
	/// </summary>
	[Fact]
	public async Task HandleAsync_NonExistingUser_ReturnsEmptyCollectionAsync()
	{
		// Arrange
		const long userId = 999;

		UserManager
			.FindByIdAsync(userId.ToString())
			.Returns((ApplicationUser?)null);

		GetUserRolesQuery query =
			new(userId);

		// Act
		IEnumerable<string> result =
			await GetUserRolesQueryHandler.HandleAsync(
				query,
				UserManager,
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
		ApplicationUser user =
			new()
			{
				Id = userId,
				UserName = "testuser",
				Email = "test@example.com",
			};

		List<string> roles =
			["Admin"];

		UserManager
			.FindByIdAsync(userId.ToString())
			.Returns(user);

		UserManager
			.GetRolesAsync(user)
			.Returns(roles);

		GetUserRolesQuery query =
			new(userId);

		// Act - First call populates cache
		IEnumerable<string> firstResult =
			await GetUserRolesQueryHandler.HandleAsync(
				query,
				UserManager,
				CacheProvider,
				CancellationToken.None);

		// Second call should use cache
		IEnumerable<string> secondResult =
			await GetUserRolesQueryHandler.HandleAsync(
				query,
				UserManager,
				CacheProvider,
				CancellationToken.None);

		// Assert
		firstResult.Count().ShouldBe(1);
		secondResult.Count().ShouldBe(1);

		// UserManager should only be called once (second call uses cache)
		await UserManager
			.Received(1)
			.FindByIdAsync(userId.ToString());
	}
}
