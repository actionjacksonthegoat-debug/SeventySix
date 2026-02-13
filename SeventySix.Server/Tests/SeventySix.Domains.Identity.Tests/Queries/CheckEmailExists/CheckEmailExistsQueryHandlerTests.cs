// <copyright file="CheckEmailExistsQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Time.Testing;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Identity.Tests.Queries.CheckEmailExists;

/// <summary>
/// Integration tests for <see cref="CheckEmailExistsQueryHandler"/>.
/// Tests require database for EF LINQ queries through UserManager.Users.
/// </summary>
/// <remarks>
/// 80/20 Focus: Tests critical email uniqueness validation for registration/profile updates.
/// Security: Prevents duplicate email registrations.
/// </remarks>
[Collection(CollectionNames.IdentityPostgreSql)]
public class CheckEmailExistsQueryHandlerTests(
	IdentityPostgreSqlFixture fixture) : DataPostgreSqlTestBase(fixture)
{
	private static readonly FakeTimeProvider TimeProvider =
		new(TestTimeProviderBuilder.DefaultTime);

	/// <summary>
	/// Tests that existing email returns true.
	/// </summary>
	[Fact]
	public async Task HandleAsync_EmailExists_ReturnsTrueAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		const string TestEmail = "existing@example.com";

		ApplicationUser existingUser =
			new UserBuilder(TimeProvider)
				.WithUsername("existinguser")
				.WithEmail(TestEmail)
				.Build();

		await userManager.CreateAsync(existingUser);

		CheckEmailExistsQuery query =
			new(
				TestEmail,
				ExcludeUserId: null);

		// Act
		bool result =
			await CheckEmailExistsQueryHandler.HandleAsync(
				query,
				userManager,
				CancellationToken.None);

		// Assert
		result.ShouldBeTrue();
	}

	/// <summary>
	/// Tests that non-existing email returns false.
	/// </summary>
	[Fact]
	public async Task HandleAsync_EmailNotExists_ReturnsFalseAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		CheckEmailExistsQuery query =
			new(
				"nonexistent@example.com",
				ExcludeUserId: null);

		// Act
		bool result =
			await CheckEmailExistsQueryHandler.HandleAsync(
				query,
				userManager,
				CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}

	/// <summary>
	/// Tests that email check is case-insensitive.
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
				.WithUsername("caseuser")
				.WithEmail("Test@Example.com")
				.Build();

		await userManager.CreateAsync(existingUser);

		CheckEmailExistsQuery query =
			new(
				"test@example.com",
				ExcludeUserId: null);

		// Act
		bool result =
			await CheckEmailExistsQueryHandler.HandleAsync(
				query,
				userManager,
				CancellationToken.None);

		// Assert
		result.ShouldBeTrue();
	}

	/// <summary>
	/// Tests that email check excludes specified user ID.
	/// </summary>
	[Fact]
	public async Task HandleAsync_WithExcludeUserId_ExcludesUserAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		const string TestEmail = "exclude@example.com";

		ApplicationUser existingUser =
			new UserBuilder(TimeProvider)
				.WithUsername("excludeuser")
				.WithEmail(TestEmail)
				.Build();

		await userManager.CreateAsync(existingUser);

		CheckEmailExistsQuery query =
			new(
				TestEmail,
				ExcludeUserId: (int)existingUser.Id);

		// Act
		bool result =
			await CheckEmailExistsQueryHandler.HandleAsync(
				query,
				userManager,
				CancellationToken.None);

		// Assert - Should return false because the existing user is excluded
		result.ShouldBeFalse();
	}

	/// <summary>
	/// Tests that email check returns true when excluding different user.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ExcludeDifferentUser_ReturnsTrueAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		const string TestEmail = "shared@example.com";

		ApplicationUser user1 =
			new UserBuilder(TimeProvider)
				.WithUsername("user1")
				.WithEmail(TestEmail)
				.Build();

		ApplicationUser user2 =
			new UserBuilder(TimeProvider)
				.WithUsername("user2")
				.WithEmail("other@example.com")
				.Build();

		await userManager.CreateAsync(user1);
		await userManager.CreateAsync(user2);

		CheckEmailExistsQuery query =
			new(
				TestEmail,
				ExcludeUserId: (int)user2.Id);

		// Act
		bool result =
			await CheckEmailExistsQueryHandler.HandleAsync(
				query,
				userManager,
				CancellationToken.None);

		// Assert - Should return true because user1 has the email and is not excluded
		result.ShouldBeTrue();
	}
}