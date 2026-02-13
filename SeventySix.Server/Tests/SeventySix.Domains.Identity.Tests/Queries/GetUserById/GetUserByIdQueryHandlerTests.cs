// <copyright file="GetUserByIdQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using NSubstitute;
using SeventySix.Shared.Constants;
using SeventySix.TestUtilities.Mocks;
using SeventySix.TestUtilities.Testing;
using Shouldly;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Identity.Tests.Queries.GetUserById;

/// <summary>
/// Unit tests for <see cref="GetUserByIdQueryHandler"/>.
/// Tests query handler with mocked dependencies following 80/20 rule.
/// </summary>
public class GetUserByIdQueryHandlerTests
{
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly IFusionCacheProvider CacheProvider;
	private readonly IFusionCache Cache;

	/// <summary>
	/// Initializes a new instance of the <see cref="GetUserByIdQueryHandlerTests"/> class.
	/// </summary>
	public GetUserByIdQueryHandlerTests()
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
	/// Tests that existing user returns correct DTO.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ExistingUser_ReturnsUserDtoAsync()
	{
		// Arrange
		const long userId = 42;
		ApplicationUser user =
			new()
			{
				Id = userId,
				UserName = "testuser",
				Email = "test@example.com",
				FullName = "Test User",
				IsActive = true,
			};

		UserManager
			.FindByIdAsync(userId.ToString())
			.Returns(user);

		GetUserByIdQuery query =
			new(userId);

		// Act
		UserDto? result =
			await GetUserByIdQueryHandler.HandleAsync(
				query,
				UserManager,
				CacheProvider,
				CancellationToken.None);

		// Assert
		result.ShouldNotBeNull();
		result.Id.ShouldBe(userId);
		result.Username.ShouldBe("testuser");
		result.Email.ShouldBe("test@example.com");
		result.FullName.ShouldBe("Test User");
		result.IsActive.ShouldBeTrue();
	}

	/// <summary>
	/// Tests that non-existing user returns null.
	/// </summary>
	[Fact]
	public async Task HandleAsync_NonExistingUser_ReturnsNullAsync()
	{
		// Arrange
		const long userId = 999;

		UserManager
			.FindByIdAsync(userId.ToString())
			.Returns((ApplicationUser?)null);

		GetUserByIdQuery query =
			new(userId);

		// Act
		UserDto? result =
			await GetUserByIdQueryHandler.HandleAsync(
				query,
				UserManager,
				CacheProvider,
				CancellationToken.None);

		// Assert
		result.ShouldBeNull();
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

		UserManager
			.FindByIdAsync(userId.ToString())
			.Returns(user);

		GetUserByIdQuery query =
			new(userId);

		// Act - First call populates cache
		UserDto? firstResult =
			await GetUserByIdQueryHandler.HandleAsync(
				query,
				UserManager,
				CacheProvider,
				CancellationToken.None);

		// Second call should use cache
		UserDto? secondResult =
			await GetUserByIdQueryHandler.HandleAsync(
				query,
				UserManager,
				CacheProvider,
				CancellationToken.None);

		// Assert
		firstResult.ShouldNotBeNull();
		secondResult.ShouldNotBeNull();
		firstResult.Id.ShouldBe(secondResult.Id);

		// UserManager should only be called once (second call uses cache)
		await UserManager
			.Received(1)
			.FindByIdAsync(userId.ToString());
	}
}