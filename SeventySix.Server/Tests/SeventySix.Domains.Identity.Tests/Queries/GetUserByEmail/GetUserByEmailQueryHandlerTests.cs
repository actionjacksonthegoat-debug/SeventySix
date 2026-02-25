// <copyright file="GetUserByEmailQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using NSubstitute;
using SeventySix.Shared.Constants;
using SeventySix.TestUtilities.Mocks;
using SeventySix.TestUtilities.Testing;
using Shouldly;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Identity.Tests.Queries.GetUserByEmail;

/// <summary>
/// Unit tests for <see cref="GetUserByEmailQueryHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on happy path and null handling.
/// </remarks>
public sealed class GetUserByEmailQueryHandlerTests
{
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly IFusionCacheProvider CacheProvider;
	private readonly IFusionCache IdentityCache;

	/// <summary>
	/// Initializes a new instance of the <see cref="GetUserByEmailQueryHandlerTests"/> class.
	/// </summary>
	public GetUserByEmailQueryHandlerTests()
	{
		UserManager =
			IdentityMockFactory.CreateUserManager();
		IdentityCache =
			TestCacheFactory.CreateIdentityCache();
		CacheProvider =
			Substitute.For<IFusionCacheProvider>();
		CacheProvider
			.GetCache(CacheNames.Identity)
			.Returns(IdentityCache);
	}

	/// <summary>
	/// Tests successful retrieval of user by email.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserExists_ReturnsUserDtoAsync()
	{
		// Arrange
		const string Email = "test@example.com";

		ApplicationUser user =
			new()
			{
				Id = 42,
				UserName = "testuser",
				Email = Email,
				IsActive = true,
			};

		GetUserByEmailQuery query =
			new(Email);

		UserManager
			.FindByEmailAsync(Email)
			.Returns(user);

		// Act
		UserDto? result =
			await GetUserByEmailQueryHandler.HandleAsync(
				query,
				UserManager,
				CacheProvider,
				CancellationToken.None);

		// Assert
		result.ShouldNotBeNull();
		result.Id.ShouldBe(42);
		result.Email.ShouldBe(Email);
	}

	/// <summary>
	/// Tests that null is returned when user not found.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserNotFound_ReturnsNullAsync()
	{
		// Arrange
		const string Email = "nonexistent@example.com";

		GetUserByEmailQuery query =
			new(Email);

		UserManager
			.FindByEmailAsync(Email)
			.Returns(default(ApplicationUser?));

		// Act
		UserDto? result =
			await GetUserByEmailQueryHandler.HandleAsync(
				query,
				UserManager,
				CacheProvider,
				CancellationToken.None);

		// Assert
		result.ShouldBeNull();
	}

	/// <summary>
	/// Tests that UserManager method is called with correct email on cache miss.
	/// </summary>
	[Fact]
	public async Task HandleAsync_CacheMiss_CallsUserManagerAsync()
	{
		// Arrange
		const string Email = "test@example.com";

		GetUserByEmailQuery query =
			new(Email);

		UserManager
			.FindByEmailAsync(Email)
			.Returns(default(ApplicationUser?));

		// Act
		await GetUserByEmailQueryHandler.HandleAsync(
			query,
			UserManager,
			CacheProvider,
			CancellationToken.None);

		// Assert
		await UserManager
			.Received(1)
			.FindByEmailAsync(Email);
	}
}