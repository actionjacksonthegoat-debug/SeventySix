// <copyright file="IdentityCacheServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Interfaces;

namespace SeventySix.Identity.Tests.Services;

/// <summary>
/// Unit tests for <see cref="IdentityCacheService"/>.
/// </summary>
/// <remarks>
/// Follows 80/20 rule: tests critical paths for cache invalidation.
/// Verifies correct cache keys are passed to the cache provider.
/// </remarks>
public sealed class IdentityCacheServiceTests
{
	private readonly ICacheProvider CacheProvider;
	private readonly IdentityCacheService ServiceUnderTest;

	/// <summary>
	/// Initializes a new instance of the <see cref="IdentityCacheServiceTests"/> class.
	/// </summary>
	public IdentityCacheServiceTests()
	{
		CacheProvider =
			Substitute.For<ICacheProvider>();

		ServiceUnderTest =
			new IdentityCacheService(CacheProvider);
	}

	/// <summary>
	/// Verifies InvalidateUserAsync removes user by ID and profile cache keys.
	/// </summary>
	[Fact]
	public async Task InvalidateUserAsync_WithUserId_RemovesUserByIdAndProfileKeysAsync()
	{
		// Arrange
		const long UserId = 123;

		// Act
		await ServiceUnderTest.InvalidateUserAsync(UserId);

		// Assert
		await CacheProvider.Received(1)
			.RemoveManyAsync(
				CacheNames.Identity,
				Arg.Is<IEnumerable<string>>(
					keys =>
						keys.Contains(IdentityCacheKeys.UserById(UserId))
						&& keys.Contains(IdentityCacheKeys.UserProfile(UserId))));
	}

	/// <summary>
	/// Verifies InvalidateUserAsync includes email key when email is provided.
	/// </summary>
	[Fact]
	public async Task InvalidateUserAsync_WithEmail_IncludesEmailKeyAsync()
	{
		// Arrange
		const long UserId = 123;
		const string Email = "test@example.com";

		// Act
		await ServiceUnderTest.InvalidateUserAsync(
			UserId,
			email: Email);

		// Assert
		await CacheProvider.Received(1)
			.RemoveManyAsync(
				CacheNames.Identity,
				Arg.Is<IEnumerable<string>>(
					keys => keys.Contains(IdentityCacheKeys.UserByEmail(Email))));
	}

	/// <summary>
	/// Verifies InvalidateUserAsync includes username key when username is provided.
	/// </summary>
	[Fact]
	public async Task InvalidateUserAsync_WithUsername_IncludesUsernameKeyAsync()
	{
		// Arrange
		const long UserId = 123;
		const string Username = "testuser";

		// Act
		await ServiceUnderTest.InvalidateUserAsync(
			UserId,
			username: Username);

		// Assert
		await CacheProvider.Received(1)
			.RemoveManyAsync(
				CacheNames.Identity,
				Arg.Is<IEnumerable<string>>(
					keys => keys.Contains(IdentityCacheKeys.UserByUsername(Username))));
	}

	/// <summary>
	/// Verifies InvalidateUserRolesAsync removes role-related cache keys.
	/// </summary>
	[Fact]
	public async Task InvalidateUserRolesAsync_WithUserId_RemovesRoleKeysAsync()
	{
		// Arrange
		const long UserId = 456;

		// Act
		await ServiceUnderTest.InvalidateUserRolesAsync(UserId);

		// Assert
		await CacheProvider.Received(1)
			.RemoveManyAsync(
				CacheNames.Identity,
				Arg.Is<IEnumerable<string>>(
					keys =>
						keys.Contains(IdentityCacheKeys.UserRoles(UserId))
						&& keys.Contains(IdentityCacheKeys.AvailableRoles(UserId))));
	}

	/// <summary>
	/// Verifies InvalidateAllUsersAsync removes all users list cache key.
	/// </summary>
	[Fact]
	public async Task InvalidateAllUsersAsync_RemovesAllUsersKeyAsync()
	{
		// Act
		await ServiceUnderTest.InvalidateAllUsersAsync();

		// Assert
		await CacheProvider.Received(1)
			.RemoveAsync(
				CacheNames.Identity,
				IdentityCacheKeys.AllUsers());
	}

	/// <summary>
	/// Verifies InvalidatePermissionRequestsAsync removes permission requests cache key.
	/// </summary>
	[Fact]
	public async Task InvalidatePermissionRequestsAsync_RemovesPermissionRequestsKeyAsync()
	{
		// Act
		await ServiceUnderTest.InvalidatePermissionRequestsAsync();

		// Assert
		await CacheProvider.Received(1)
			.RemoveAsync(
				CacheNames.Identity,
				IdentityCacheKeys.PermissionRequests());
	}

	/// <summary>
	/// Verifies InvalidateBulkUsersAsync removes cache keys for all provided user IDs.
	/// </summary>
	[Fact]
	public async Task InvalidateBulkUsersAsync_WithMultipleUserIds_RemovesAllKeysAsync()
	{
		// Arrange
		IEnumerable<long> userIds =
			[1L, 2L, 3L];

		// Act
		await ServiceUnderTest.InvalidateBulkUsersAsync(userIds);

		// Assert
		await CacheProvider.Received(1)
			.RemoveManyAsync(
				CacheNames.Identity,
				Arg.Is<IEnumerable<string>>(
					keys =>
						keys.Contains(IdentityCacheKeys.UserById(1L))
						&& keys.Contains(IdentityCacheKeys.UserById(2L))
						&& keys.Contains(IdentityCacheKeys.UserById(3L))
						&& keys.Contains(IdentityCacheKeys.AllUsers())));
	}
}