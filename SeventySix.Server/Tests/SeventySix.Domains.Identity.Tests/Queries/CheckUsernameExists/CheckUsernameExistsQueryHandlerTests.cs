// <copyright file="CheckUsernameExistsQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Time.Testing;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Identity.Tests.Queries.CheckUsernameExists;

/// <summary>
/// Integration tests for <see cref="CheckUsernameExistsQueryHandler"/>.
/// Tests require database for EF LINQ queries through UserManager.Users.
/// </summary>
/// <remarks>
/// 80/20 Focus: Tests critical username uniqueness validation for registration/profile updates.
/// Security: Prevents duplicate username registrations.
/// </remarks>
[Collection(CollectionNames.IdentityPostgreSql)]
public class CheckUsernameExistsQueryHandlerTests(
	IdentityPostgreSqlFixture fixture) : DataPostgreSqlTestBase(fixture)
{
	private static readonly FakeTimeProvider TimeProvider =
		new(TestTimeProviderBuilder.DefaultTime);

	/// <summary>
	/// Tests that existing username returns true.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UsernameExists_ReturnsTrueAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		const string TestUsername = "existinguser";

		ApplicationUser existingUser =
			new UserBuilder(TimeProvider)
				.WithUsername(TestUsername)
				.WithEmail("existing@example.com")
				.Build();

		await userManager.CreateAsync(existingUser);

		CheckUsernameExistsQuery query =
			new(
				TestUsername,
				ExcludeUserId: null);

		// Act
		bool result =
			await CheckUsernameExistsQueryHandler.HandleAsync(
				query,
				userManager,
				CancellationToken.None);

		// Assert
		result.ShouldBeTrue();
	}

	/// <summary>
	/// Tests that non-existing username returns false.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UsernameNotExists_ReturnsFalseAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		CheckUsernameExistsQuery query =
			new(
				"nonexistentuser",
				ExcludeUserId: null);

		// Act
		bool result =
			await CheckUsernameExistsQueryHandler.HandleAsync(
				query,
				userManager,
				CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}

	/// <summary>
	/// Tests that username check is case-insensitive.
	/// </summary>
	[Fact]
	public async Task HandleAsync_DifferentCase_ReturnsTrueAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		ApplicationUser existingUser =
			new UserBuilder(TimeProvider)
				.WithUsername("TestUser")
				.WithEmail("case@example.com")
				.Build();

		await userManager.CreateAsync(existingUser);

		CheckUsernameExistsQuery query =
			new(
				"testuser",
				ExcludeUserId: null);

		// Act
		bool result =
			await CheckUsernameExistsQueryHandler.HandleAsync(
				query,
				userManager,
				CancellationToken.None);

		// Assert
		result.ShouldBeTrue();
	}

	/// <summary>
	/// Tests that username check excludes specified user ID.
	/// </summary>
	[Fact]
	public async Task HandleAsync_WithExcludeUserId_ExcludesUserAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		// Use unique username to isolate test data
		string testUsername =
			$"excludeuser_{Guid.NewGuid():N}";

		ApplicationUser existingUser =
			new UserBuilder(TimeProvider)
				.WithUsername(testUsername)
				.WithEmail($"{testUsername}@example.com")
				.Build();

		await userManager.CreateAsync(existingUser);

		CheckUsernameExistsQuery query =
			new(
				testUsername,
				ExcludeUserId: existingUser.Id);

		// Act
		bool result =
			await CheckUsernameExistsQueryHandler.HandleAsync(
				query,
				userManager,
				CancellationToken.None);

		// Assert - Should return false because the existing user is excluded
		result.ShouldBeFalse();
	}

	/// <summary>
	/// Tests that username check returns true when excluding different user.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ExcludeDifferentUser_ReturnsTrueAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		const string TestUsername = "sharedname";

		ApplicationUser user1 =
			new UserBuilder(TimeProvider)
				.WithUsername(TestUsername)
				.WithEmail("user1@example.com")
				.Build();

		ApplicationUser user2 =
			new UserBuilder(TimeProvider)
				.WithUsername("differentuser")
				.WithEmail("user2@example.com")
				.Build();

		await userManager.CreateAsync(user1);
		await userManager.CreateAsync(user2);

		CheckUsernameExistsQuery query =
			new(
				TestUsername,
				ExcludeUserId: user2.Id);

		// Act
		bool result =
			await CheckUsernameExistsQueryHandler.HandleAsync(
				query,
				userManager,
				CancellationToken.None);

		// Assert - Should return true because user1 has the username and is not excluded
		result.ShouldBeTrue();
	}
}