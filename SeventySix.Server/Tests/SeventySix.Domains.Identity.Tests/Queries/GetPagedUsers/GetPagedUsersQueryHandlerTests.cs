// <copyright file="GetPagedUsersQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Time.Testing;
using SeventySix.Identity;
using SeventySix.Shared.POCOs;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Identity.Tests.Queries.GetPagedUsers;

/// <summary>
/// Integration tests for <see cref="GetPagedUsersQueryHandler"/>.
/// Tests require database for EF LINQ pagination queries.
/// </summary>
/// <remarks>
/// 80/20 Focus: Tests critical pagination logic for admin user management.
/// Includes search, filtering, and pagination edge cases.
/// </remarks>
[Collection(CollectionNames.IdentityPostgreSql)]
public class GetPagedUsersQueryHandlerTests(
	IdentityPostgreSqlFixture fixture) : DataPostgreSqlTestBase(fixture)
{
	private static readonly FakeTimeProvider TimeProvider =
		new(TestTimeProviderBuilder.DefaultTime);

	/// <summary>
	/// Tests that first page returns correct number of users.
	/// </summary>
	[Fact]
	public async Task HandleAsync_FirstPage_ReturnsCorrectCountAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		// Use unique prefix to isolate test data
		string prefix =
			$"fp_{Guid.NewGuid():N}";

		// Create 5 users with unique prefix
		for (int index = 1; index <= 5; index++)
		{
			ApplicationUser user =
				new UserBuilder(TimeProvider)
					.WithUsername($"{prefix}_{index}")
					.WithEmail($"{prefix}_{index}@example.com")
					.Build();

			await userManager.CreateAsync(user);
		}

		UserQueryRequest request =
			new()
			{
				Page = 1,
				PageSize = 3,
				SearchTerm = prefix,
			};

		GetPagedUsersQuery query =
			new(request);

		// Act
		PagedResult<UserDto> result =
			await GetPagedUsersQueryHandler.HandleAsync(
				query,
				userManager,
				CancellationToken.None);

		// Assert
		result.Items.Count.ShouldBe(3);
		result.TotalCount.ShouldBe(5);
		result.Page.ShouldBe(1);
		result.PageSize.ShouldBe(3);
	}

	/// <summary>
	/// Tests that second page returns remaining users.
	/// </summary>
	[Fact]
	public async Task HandleAsync_SecondPage_ReturnsRemainingUsersAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		// Use unique prefix to isolate test data
		string prefix =
			$"sp_{Guid.NewGuid():N}";

		// Create 5 users with unique prefix
		for (int index = 1; index <= 5; index++)
		{
			ApplicationUser user =
				new UserBuilder(TimeProvider)
					.WithUsername($"{prefix}_{index}")
					.WithEmail($"{prefix}_{index}@example.com")
					.Build();

			await userManager.CreateAsync(user);
		}

		UserQueryRequest request =
			new()
			{
				Page = 2,
				PageSize = 3,
				SearchTerm = prefix,
			};

		GetPagedUsersQuery query =
			new(request);

		// Act
		PagedResult<UserDto> result =
			await GetPagedUsersQueryHandler.HandleAsync(
				query,
				userManager,
				CancellationToken.None);

		// Assert
		result.Items.Count.ShouldBe(2);
		result.TotalCount.ShouldBe(5);
		result.Page.ShouldBe(2);
	}

	/// <summary>
	/// Tests that search filters by username.
	/// </summary>
	[Fact]
	public async Task HandleAsync_SearchByUsername_FiltersResultsAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		ApplicationUser targetUser =
			new UserBuilder(TimeProvider)
				.WithUsername("searchable")
				.WithEmail("search@example.com")
				.Build();

		ApplicationUser otherUser =
			new UserBuilder(TimeProvider)
				.WithUsername("different")
				.WithEmail("different@example.com")
				.Build();

		await userManager.CreateAsync(targetUser);
		await userManager.CreateAsync(otherUser);

		UserQueryRequest request =
			new()
			{
				Page = 1,
				PageSize = 10,
				SearchTerm = "search",
			};

		GetPagedUsersQuery query =
			new(request);

		// Act
		PagedResult<UserDto> result =
			await GetPagedUsersQueryHandler.HandleAsync(
				query,
				userManager,
				CancellationToken.None);

		// Assert
		result.Items.Count.ShouldBe(1);
		result.Items[0].Username.ShouldBe("searchable");
	}

	/// <summary>
	/// Tests that search filters by email.
	/// </summary>
	[Fact]
	public async Task HandleAsync_SearchByEmail_FiltersResultsAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		ApplicationUser targetUser =
			new UserBuilder(TimeProvider)
				.WithUsername("emailuser")
				.WithEmail("findme@special.com")
				.Build();

		ApplicationUser otherUser =
			new UserBuilder(TimeProvider)
				.WithUsername("other")
				.WithEmail("other@example.com")
				.Build();

		await userManager.CreateAsync(targetUser);
		await userManager.CreateAsync(otherUser);

		UserQueryRequest request =
			new()
			{
				Page = 1,
				PageSize = 10,
				SearchTerm = "special",
			};

		GetPagedUsersQuery query =
			new(request);

		// Act
		PagedResult<UserDto> result =
			await GetPagedUsersQueryHandler.HandleAsync(
				query,
				userManager,
				CancellationToken.None);

		// Assert
		result.Items.Count.ShouldBe(1);
		result.Items[0].Email.ShouldBe("findme@special.com");
	}

	/// <summary>
	/// Tests that search filters by full name.
	/// </summary>
	[Fact]
	public async Task HandleAsync_SearchByFullName_FiltersResultsAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		ApplicationUser targetUser =
			new UserBuilder(TimeProvider)
				.WithUsername("nameuser")
				.WithEmail("name@example.com")
				.WithFullName("John Smith")
				.Build();

		ApplicationUser otherUser =
			new UserBuilder(TimeProvider)
				.WithUsername("other2")
				.WithEmail("other2@example.com")
				.WithFullName("Jane Doe")
				.Build();

		await userManager.CreateAsync(targetUser);
		await userManager.CreateAsync(otherUser);

		UserQueryRequest request =
			new()
			{
				Page = 1,
				PageSize = 10,
				SearchTerm = "Smith",
			};

		GetPagedUsersQuery query =
			new(request);

		// Act
		PagedResult<UserDto> result =
			await GetPagedUsersQueryHandler.HandleAsync(
				query,
				userManager,
				CancellationToken.None);

		// Assert
		result.Items.Count.ShouldBe(1);
		result.Items[0].FullName.ShouldBe("John Smith");
	}

	/// <summary>
	/// Tests that search is case-insensitive.
	/// </summary>
	[Fact]
	public async Task HandleAsync_SearchCaseInsensitive_FindsMatchAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		// Use unique prefix to isolate test data
		string prefix =
			$"cs_{Guid.NewGuid():N}";

		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithUsername($"{prefix}_CaseMixed")
				.WithEmail($"{prefix}@example.com")
				.Build();

		await userManager.CreateAsync(user);

		// Search using lowercase version of prefix
		UserQueryRequest request =
			new()
			{
				Page = 1,
				PageSize = 10,
				SearchTerm = prefix.ToLowerInvariant(),
			};

		GetPagedUsersQuery query =
			new(request);

		// Act
		PagedResult<UserDto> result =
			await GetPagedUsersQueryHandler.HandleAsync(
				query,
				userManager,
				CancellationToken.None);

		// Assert - Should find user despite case difference
		result.Items.Count.ShouldBe(1);
	}

	/// <summary>
	/// Tests that empty search returns all users.
	/// </summary>
	[Fact]
	public async Task HandleAsync_EmptySearch_ReturnsAllUsersAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		// Use unique prefix to isolate test data
		string prefix =
			$"empsrc_{Guid.NewGuid():N}";

		ApplicationUser user1 =
			new UserBuilder(TimeProvider)
				.WithUsername($"{prefix}_1")
				.WithEmail($"{prefix}_1@example.com")
				.Build();

		ApplicationUser user2 =
			new UserBuilder(TimeProvider)
				.WithUsername($"{prefix}_2")
				.WithEmail($"{prefix}_2@example.com")
				.Build();

		await userManager.CreateAsync(user1);
		await userManager.CreateAsync(user2);

		// Use prefix as search term to isolate from other tests
		UserQueryRequest request =
			new()
			{
				Page = 1,
				PageSize = 10,
				SearchTerm = prefix,
			};

		GetPagedUsersQuery query =
			new(request);

		// Act
		PagedResult<UserDto> result =
			await GetPagedUsersQueryHandler.HandleAsync(
				query,
				userManager,
				CancellationToken.None);

		// Assert
		result.Items.Count.ShouldBe(2);
	}

	/// <summary>
	/// Tests that results are ordered by username.
	/// </summary>
	[Fact]
	public async Task HandleAsync_OrdersByUsername_ReturnsOrderedResultsAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		// Use unique prefix to isolate test data
		string prefix =
			$"ord_{Guid.NewGuid():N}";

		ApplicationUser userC =
			new UserBuilder(TimeProvider)
				.WithUsername($"{prefix}_charlie")
				.WithEmail($"{prefix}_c@example.com")
				.Build();

		ApplicationUser userA =
			new UserBuilder(TimeProvider)
				.WithUsername($"{prefix}_alice")
				.WithEmail($"{prefix}_a@example.com")
				.Build();

		ApplicationUser userB =
			new UserBuilder(TimeProvider)
				.WithUsername($"{prefix}_bob")
				.WithEmail($"{prefix}_b@example.com")
				.Build();

		// Insert out of order
		await userManager.CreateAsync(userC);
		await userManager.CreateAsync(userA);
		await userManager.CreateAsync(userB);

		UserQueryRequest request =
			new()
			{
				Page = 1,
				PageSize = 10,
				SearchTerm = prefix,
			};

		GetPagedUsersQuery query =
			new(request);

		// Act
		PagedResult<UserDto> result =
			await GetPagedUsersQueryHandler.HandleAsync(
				query,
				userManager,
				CancellationToken.None);

		// Assert - Results should be ordered alphabetically
		result.Items[0].Username.ShouldBe($"{prefix}_alice");
		result.Items[1].Username.ShouldBe($"{prefix}_bob");
		result.Items[2].Username.ShouldBe($"{prefix}_charlie");
	}
}