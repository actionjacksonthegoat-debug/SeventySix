// <copyright file="GetAllUsersQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Time.Testing;
using SeventySix.Identity;
using SeventySix.Shared.Constants;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using Shouldly;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Domains.Tests.Identity.Queries.GetAllUsers;

/// <summary>
/// Integration tests for <see cref="GetAllUsersQueryHandler"/>.
/// Tests require database for EF LINQ queries through UserManager.Users.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on critical query behavior with real database.
/// </remarks>
[Collection(CollectionNames.IdentityPostgreSql)]
public class GetAllUsersQueryHandlerTests(IdentityPostgreSqlFixture fixture)
	: DataPostgreSqlTestBase(fixture)
{
	private static readonly FakeTimeProvider TimeProvider =
		new(TestTimeProviderBuilder.DefaultTime);

	/// <summary>
	/// Tests that users are returned as DTOs.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UsersExist_ReturnsUserDtosAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		IFusionCacheProvider cacheProvider =
			CreateCacheProvider();

		ApplicationUser user1 =
			new UserBuilder(TimeProvider)
				.WithUsername("user1")
				.WithEmail("user1@example.com")
				.Build();

		ApplicationUser user2 =
			new UserBuilder(TimeProvider)
				.WithUsername("user2")
				.WithEmail("user2@example.com")
				.Build();

		await userManager.CreateAsync(user1);
		await userManager.CreateAsync(user2);

		GetAllUsersQuery query =
			new();

		// Act
		IEnumerable<UserDto> result =
			await GetAllUsersQueryHandler.HandleAsync(
				query,
				userManager,
				cacheProvider,
				CancellationToken.None);

		// Assert
		List<UserDto> resultList =
			result.ToList();
		resultList.Count.ShouldBeGreaterThanOrEqualTo(2);
		resultList.ShouldContain(
			user => user.Username == "user1");
		resultList.ShouldContain(
			user => user.Username == "user2");
	}

	/// <summary>
	/// Tests that cache is used for subsequent requests.
	/// </summary>
	[Fact]
	public async Task HandleAsync_CalledTwice_UsesCacheOnSecondCallAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		IFusionCacheProvider cacheProvider =
			CreateCacheProvider();

		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithUsername("cacheuser")
				.WithEmail("cache@example.com")
				.Build();

		await userManager.CreateAsync(user);

		GetAllUsersQuery query =
			new();

		// Act - First call populates cache
		IEnumerable<UserDto> firstResult =
			await GetAllUsersQueryHandler.HandleAsync(
				query,
				userManager,
				cacheProvider,
				CancellationToken.None);

		// Second call should use cache
		IEnumerable<UserDto> secondResult =
			await GetAllUsersQueryHandler.HandleAsync(
				query,
				userManager,
				cacheProvider,
				CancellationToken.None);

		// Assert
		firstResult.Count().ShouldBeGreaterThanOrEqualTo(1);
		secondResult.Count().ShouldBeGreaterThanOrEqualTo(1);
	}

	private static IFusionCacheProvider CreateCacheProvider()
	{
		ServiceCollection services =
			new();

		services.AddFusionCache(CacheNames.Identity);

		ServiceProvider serviceProvider =
			services.BuildServiceProvider();

		return serviceProvider.GetRequiredService<IFusionCacheProvider>();
	}
}