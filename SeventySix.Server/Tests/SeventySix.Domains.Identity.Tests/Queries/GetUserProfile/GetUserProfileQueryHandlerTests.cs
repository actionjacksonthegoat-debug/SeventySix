// <copyright file="GetUserProfileQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Shared.Constants;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Mocks;
using SeventySix.TestUtilities.Testing;
using Shouldly;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Identity.Tests.Queries.GetUserProfile;

/// <summary>
/// Unit tests for <see cref="GetUserProfileQueryHandler"/>.
/// Tests query handler with mocked dependencies following 80/20 rule.
/// </summary>
public class GetUserProfileQueryHandlerTests
{
	private static readonly FakeTimeProvider TimeProvider =
		new(TestTimeProviderBuilder.DefaultTime);

	private readonly UserManager<ApplicationUser> UserManager;
	private readonly IFusionCacheProvider CacheProvider;
	private readonly IFusionCache Cache;

	/// <summary>
	/// Initializes a new instance of the <see cref="GetUserProfileQueryHandlerTests"/> class.
	/// </summary>
	public GetUserProfileQueryHandlerTests()
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
	/// Tests that existing user profile is returned correctly.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ExistingUser_ReturnsUserProfileAsync()
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
				LastLoginAt = TimeProvider.GetUtcNow(),
			};

		List<string> roles =
			["Admin", "Developer"];
		List<UserLoginInfo> logins =
			[new UserLoginInfo("Google", "12345", "Google")];

		UserManager
			.FindByIdAsync(userId.ToString())
			.Returns(user);

		UserManager
			.GetRolesAsync(user)
			.Returns(roles);

		UserManager
			.GetLoginsAsync(user)
			.Returns(logins);

		UserManager
			.HasPasswordAsync(user)
			.Returns(true);

		GetUserProfileQuery query =
			new(userId);

		// Act
		UserProfileDto? result =
			await GetUserProfileQueryHandler.HandleAsync(
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
		result.Roles.Count.ShouldBe(2);
		result.HasPassword.ShouldBeTrue();
		result.LinkedProviders.Count.ShouldBe(1);
		result.LinkedProviders.ShouldContain("Google");
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

		GetUserProfileQuery query =
			new(userId);

		// Act
		UserProfileDto? result =
			await GetUserProfileQueryHandler.HandleAsync(
				query,
				UserManager,
				CacheProvider,
				CancellationToken.None);

		// Assert
		result.ShouldBeNull();
	}

	/// <summary>
	/// Tests that user without password returns HasPassword as false.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserWithoutPassword_HasPasswordFalseAsync()
	{
		// Arrange
		const long userId = 42;
		ApplicationUser user =
			new()
			{
				Id = userId,
				UserName = "oauthuser",
				Email = "oauth@example.com",
			};

		List<string> roles =
			["User"];
		List<UserLoginInfo> logins =
			[new UserLoginInfo("GitHub", "67890", "GitHub")];

		UserManager
			.FindByIdAsync(userId.ToString())
			.Returns(user);

		UserManager
			.GetRolesAsync(user)
			.Returns(roles);

		UserManager
			.GetLoginsAsync(user)
			.Returns(logins);

		UserManager
			.HasPasswordAsync(user)
			.Returns(false);

		GetUserProfileQuery query =
			new(userId);

		// Act
		UserProfileDto? result =
			await GetUserProfileQueryHandler.HandleAsync(
				query,
				UserManager,
				CacheProvider,
				CancellationToken.None);

		// Assert
		result.ShouldNotBeNull();
		result.HasPassword.ShouldBeFalse();
		result.LinkedProviders.ShouldContain("GitHub");
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
		List<UserLoginInfo> logins =
			[];

		UserManager
			.FindByIdAsync(userId.ToString())
			.Returns(user);

		UserManager
			.GetRolesAsync(user)
			.Returns(roles);

		UserManager
			.GetLoginsAsync(user)
			.Returns(logins);

		UserManager
			.HasPasswordAsync(user)
			.Returns(true);

		GetUserProfileQuery query =
			new(userId);

		// Act - First call populates cache
		UserProfileDto? firstResult =
			await GetUserProfileQueryHandler.HandleAsync(
				query,
				UserManager,
				CacheProvider,
				CancellationToken.None);

		// Second call should use cache
		UserProfileDto? secondResult =
			await GetUserProfileQueryHandler.HandleAsync(
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