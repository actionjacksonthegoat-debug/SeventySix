// <copyright file="CacheInvalidationServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.Api.Infrastructure.Services;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Interfaces;
using SeventySix.TestUtilities.Testing;
using Shouldly;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Api.Tests.Infrastructure.Services;

/// <summary>
/// Unit tests for <see cref="CacheInvalidationService"/>.
/// </summary>
/// <remarks>
/// Tests verify that cache invalidation correctly removes cached entries
/// from the appropriate named caches.
/// </remarks>
public sealed class CacheInvalidationServiceTests
{
	private readonly IFusionCacheProvider CacheProvider;
	private readonly IFusionCache IdentityCache;
	private readonly IFusionCache ApiTrackingCache;
	private readonly ICacheInvalidationService Service;

	/// <summary>
	/// Initializes a new instance of the <see cref="CacheInvalidationServiceTests"/> class.
	/// </summary>
	public CacheInvalidationServiceTests()
	{
		IdentityCache =
			TestCacheFactory.CreateIdentityCache();
		ApiTrackingCache =
			TestCacheFactory.CreateApiTrackingCache();
		CacheProvider =
			Substitute.For<IFusionCacheProvider>();
		CacheProvider
			.GetCache(CacheNames.Identity)
			.Returns(IdentityCache);
		CacheProvider
			.GetCache(CacheNames.ApiTracking)
			.Returns(ApiTrackingCache);

		Service =
			new CacheInvalidationService(CacheProvider);
	}

	/// <summary>
	/// Tests that InvalidateUserCacheAsync removes user-by-id cache.
	/// </summary>
	[Fact]
	public async Task InvalidateUserCacheAsync_RemovesUserByIdCacheAsync()
	{
		// Arrange
		const long UserId = 42;
		string cacheKey =
			$"identity:user:{UserId}";

		await IdentityCache.SetAsync(
			cacheKey,
			"cached-user");

		// Act
		await Service.InvalidateUserCacheAsync(UserId);

		// Assert
		string? cachedValue =
			await IdentityCache.GetOrDefaultAsync<string?>(cacheKey);

		cachedValue.ShouldBeNull();
	}

	/// <summary>
	/// Tests that InvalidateUserCacheAsync removes email-keyed cache when email provided.
	/// </summary>
	[Fact]
	public async Task InvalidateUserCacheAsync_WithEmail_RemovesEmailCacheAsync()
	{
		// Arrange
		const long UserId = 42;
		const string Email = "test@example.com";
		string cacheKey =
			$"identity:user:email:{Email.ToLowerInvariant()}";

		await IdentityCache.SetAsync(
			cacheKey,
			"cached-user");

		// Act
		await Service.InvalidateUserCacheAsync(
			UserId,
			email: Email);

		// Assert
		string? cachedValue =
			await IdentityCache.GetOrDefaultAsync<string?>(cacheKey);

		cachedValue.ShouldBeNull();
	}

	/// <summary>
	/// Tests that InvalidateUserCacheAsync removes username-keyed cache when username provided.
	/// </summary>
	[Fact]
	public async Task InvalidateUserCacheAsync_WithUsername_RemovesUsernameCacheAsync()
	{
		// Arrange
		const long UserId = 42;
		const string Username = "testuser";
		string cacheKey =
			$"identity:user:username:{Username.ToLowerInvariant()}";

		await IdentityCache.SetAsync(
			cacheKey,
			"cached-user");

		// Act
		await Service.InvalidateUserCacheAsync(
			UserId,
			username: Username);

		// Assert
		string? cachedValue =
			await IdentityCache.GetOrDefaultAsync<string?>(cacheKey);

		cachedValue.ShouldBeNull();
	}

	/// <summary>
	/// Tests that InvalidateUserRolesCacheAsync removes user roles cache.
	/// </summary>
	[Fact]
	public async Task InvalidateUserRolesCacheAsync_RemovesRolesCacheAsync()
	{
		// Arrange
		const long UserId = 42;
		string userRolesKey =
			$"identity:user-roles:{UserId}";
		string availableRolesKey =
			$"identity:available-roles:{UserId}";

		await IdentityCache.SetAsync(
			userRolesKey,
			"cached-roles");
		await IdentityCache.SetAsync(
			availableRolesKey,
			"cached-available");

		// Act
		await Service.InvalidateUserRolesCacheAsync(UserId);

		// Assert
		string? rolesValue =
			await IdentityCache.GetOrDefaultAsync<string?>(userRolesKey);
		string? availableValue =
			await IdentityCache.GetOrDefaultAsync<string?>(availableRolesKey);

		rolesValue.ShouldBeNull();
		availableValue.ShouldBeNull();
	}

	/// <summary>
	/// Tests that InvalidateApiStatisticsCacheAsync removes statistics cache.
	/// </summary>
	[Fact]
	public async Task InvalidateApiStatisticsCacheAsync_RemovesStatisticsCacheAsync()
	{
		// Arrange
		DateOnly testDate =
			new(2024, 1, 15);
		string cacheKey =
			$"apitracking:stats:{testDate:yyyy-MM-dd}";

		await ApiTrackingCache.SetAsync(
			cacheKey,
			"cached-statistics");

		// Act
		await Service.InvalidateApiStatisticsCacheAsync(testDate);

		// Assert
		string? cachedValue =
			await ApiTrackingCache.GetOrDefaultAsync<string?>(cacheKey);

		cachedValue.ShouldBeNull();
	}

	/// <summary>
	/// Tests that InvalidatePermissionRequestsCacheAsync removes permission requests cache.
	/// </summary>
	[Fact]
	public async Task InvalidatePermissionRequestsCacheAsync_RemovesCacheAsync()
	{
		// Arrange
		const string CacheKey = "identity:permission-requests";

		await IdentityCache.SetAsync(
			CacheKey,
			"cached-requests");

		// Act
		await Service.InvalidatePermissionRequestsCacheAsync();

		// Assert
		string? cachedValue =
			await IdentityCache.GetOrDefaultAsync<string?>(CacheKey);

		cachedValue.ShouldBeNull();
	}

	/// <summary>
	/// Tests that InvalidateAllUsersCacheAsync removes all users cache.
	/// </summary>
	[Fact]
	public async Task InvalidateAllUsersCacheAsync_RemovesCacheAsync()
	{
		// Arrange
		const string CacheKey = "identity:all-users";

		await IdentityCache.SetAsync(
			CacheKey,
			"cached-users");

		// Act
		await Service.InvalidateAllUsersCacheAsync();

		// Assert
		string? cachedValue =
			await IdentityCache.GetOrDefaultAsync<string?>(CacheKey);

		cachedValue.ShouldBeNull();
	}

	/// <summary>
	/// Tests that InvalidateUserProfileCacheAsync removes profile cache key.
	/// </summary>
	[Fact]
	public async Task InvalidateUserProfileCacheAsync_RemovesProfileKeyAsync()
	{
		// Arrange
		const long UserId = 42;
		string cacheKey =
			$"identity:profile:{UserId}";

		await IdentityCache.SetAsync(
			cacheKey,
			"cached-profile");

		// Act
		await Service.InvalidateUserProfileCacheAsync(UserId);

		// Assert
		string? cachedValue =
			await IdentityCache.GetOrDefaultAsync<string?>(cacheKey);

		cachedValue.ShouldBeNull();
	}

	/// <summary>
	/// Tests that InvalidateUserPasswordCacheAsync removes both profile and user keys.
	/// </summary>
	[Fact]
	public async Task InvalidateUserPasswordCacheAsync_RemovesProfileAndUserKeysAsync()
	{
		// Arrange
		const long UserId = 42;
		string profileKey =
			$"identity:profile:{UserId}";
		string userKey =
			$"identity:user:{UserId}";

		await IdentityCache.SetAsync(
			profileKey,
			"cached-profile");
		await IdentityCache.SetAsync(
			userKey,
			"cached-user");

		// Act
		await Service.InvalidateUserPasswordCacheAsync(UserId);

		// Assert
		string? profileValue =
			await IdentityCache.GetOrDefaultAsync<string?>(profileKey);
		string? userValue =
			await IdentityCache.GetOrDefaultAsync<string?>(userKey);

		profileValue.ShouldBeNull();
		userValue.ShouldBeNull();
	}

	/// <summary>
	/// Tests that InvalidateBulkUsersCacheAsync removes all affected keys and all-users list.
	/// </summary>
	[Fact]
	public async Task InvalidateBulkUsersCacheAsync_RemovesAllAffectedKeysAsync()
	{
		// Arrange
		long[] userIds =
			[1, 2, 3];
		const string AllUsersKey = "identity:all-users";

		// Populate cache for all users
		foreach (long userId in userIds)
		{
			await IdentityCache.SetAsync(
				$"identity:user:{userId}",
				$"cached-user-{userId}");
			await IdentityCache.SetAsync(
				$"identity:profile:{userId}",
				$"cached-profile-{userId}");
		}

		await IdentityCache.SetAsync(
			AllUsersKey,
			"cached-all-users");

		// Act
		await Service.InvalidateBulkUsersCacheAsync(userIds);

		// Assert
		foreach (long userId in userIds)
		{
			string? userValue =
				await IdentityCache.GetOrDefaultAsync<string?>(
					$"identity:user:{userId}");
			string? profileValue =
				await IdentityCache.GetOrDefaultAsync<string?>(
					$"identity:profile:{userId}");

			userValue.ShouldBeNull();
			profileValue.ShouldBeNull();
		}

		string? allUsersValue =
			await IdentityCache.GetOrDefaultAsync<string?>(AllUsersKey);

		allUsersValue.ShouldBeNull();
	}
}