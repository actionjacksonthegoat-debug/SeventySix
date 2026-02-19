// <copyright file="BulkUpdateActiveStatusCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Identity.Tests.Commands.BulkUpdateActiveStatus;

/// <summary>
/// Integration tests for <see cref="BulkUpdateActiveStatusCommandHandler"/>.
/// Uses PostgreSQL because <see cref="Microsoft.EntityFrameworkCore.RelationalQueryableExtensions.ExecuteUpdateAsync{TSource}"/>
/// is not supported by the in-memory provider.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on bulk operation behavior.
/// </remarks>
[Collection(CollectionNames.IdentityPostgreSql)]
public sealed class BulkUpdateActiveStatusCommandHandlerTests(
	IdentityPostgreSqlFixture fixture) : DataPostgreSqlTestBase(fixture)
{
	private static readonly FakeTimeProvider TimeProvider =
		new(TestTimeProviderBuilder.DefaultTime);

	/// <summary>
	/// Tests successful activation of multiple users.
	/// </summary>
	[Fact]
	public async Task HandleAsync_MultipleUsers_ActivatesAllAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		ApplicationUser user1 =
			await CreateUserAsync(userManager, 1, isActive: false);
		ApplicationUser user2 =
			await CreateUserAsync(userManager, 2, isActive: false);
		ApplicationUser user3 =
			await CreateUserAsync(userManager, 3, isActive: false);

		List<long> userIds =
			[user1.Id, user2.Id, user3.Id];

		BulkUpdateActiveStatusCommand command =
			new(userIds, IsActive: true, ModifiedBy: "admin");

		IIdentityCacheService identityCache =
			Substitute.For<IIdentityCacheService>();

		// Act
		long result =
			await BulkUpdateActiveStatusCommandHandler.HandleAsync(
				command,
				context,
				identityCache,
				TimeProvider,
				CancellationToken.None);

		// Assert
		result.ShouldBe(3);

		await using IdentityDbContext verifyContext =
			CreateIdentityDbContext();

		verifyContext.Users.Where(u => userIds.Contains(u.Id)).All(u => u.IsActive).ShouldBeTrue();
	}

	/// <summary>
	/// Tests successful deactivation of multiple users.
	/// </summary>
	[Fact]
	public async Task HandleAsync_MultipleUsers_DeactivatesAllAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		ApplicationUser user1 =
			await CreateUserAsync(userManager, 1, isActive: true);
		ApplicationUser user2 =
			await CreateUserAsync(userManager, 2, isActive: true);

		List<long> userIds =
			[user1.Id, user2.Id];

		BulkUpdateActiveStatusCommand command =
			new(userIds, IsActive: false, ModifiedBy: "admin");

		IIdentityCacheService identityCache =
			Substitute.For<IIdentityCacheService>();

		// Act
		long result =
			await BulkUpdateActiveStatusCommandHandler.HandleAsync(
				command,
				context,
				identityCache,
				TimeProvider,
				CancellationToken.None);

		// Assert
		result.ShouldBe(2);

		await using IdentityDbContext verifyContext =
			CreateIdentityDbContext();

		verifyContext.Users.Where(u => userIds.Contains(u.Id)).Any(u => u.IsActive).ShouldBeFalse();
	}

	/// <summary>
	/// Tests that non-existent user IDs are silently skipped.
	/// </summary>
	[Fact]
	public async Task HandleAsync_SomeUsersNotFound_SkipsThemAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		ApplicationUser user1 =
			await CreateUserAsync(userManager, 1, isActive: false);
		ApplicationUser user2 =
			await CreateUserAsync(userManager, 2, isActive: false);

		// Include a non-existent ID; ExecuteUpdateAsync simply skips it
		List<long> userIds =
			[user1.Id, 999_999, user2.Id];

		BulkUpdateActiveStatusCommand command =
			new(userIds, IsActive: true, ModifiedBy: "admin");

		IIdentityCacheService identityCache =
			Substitute.For<IIdentityCacheService>();

		// Act
		long result =
			await BulkUpdateActiveStatusCommandHandler.HandleAsync(
				command,
				context,
				identityCache,
				TimeProvider,
				CancellationToken.None);

		// Assert — only the two existing users were updated
		result.ShouldBe(2);
	}

	/// <summary>
	/// Tests that users whose IsActive already matches the target value are not counted.
	/// ExecuteUpdateAsync only affects rows where the current value differs.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UsersAlreadyActive_NotCountedAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		// user1 is already active — should be skipped by the WHERE clause
		ApplicationUser user1 =
			await CreateUserAsync(userManager, 1, isActive: true);
		ApplicationUser user2 =
			await CreateUserAsync(userManager, 2, isActive: false);

		List<long> userIds =
			[user1.Id, user2.Id];

		BulkUpdateActiveStatusCommand command =
			new(userIds, IsActive: true, ModifiedBy: "admin");

		IIdentityCacheService identityCache =
			Substitute.For<IIdentityCacheService>();

		// Act
		long result =
			await BulkUpdateActiveStatusCommandHandler.HandleAsync(
				command,
				context,
				identityCache,
				TimeProvider,
				CancellationToken.None);

		// Assert — only user2 needed updating
		result.ShouldBe(1);
	}

	/// <summary>
	/// Tests that empty user list returns zero.
	/// </summary>
	[Fact]
	public async Task HandleAsync_EmptyUserList_ReturnsZeroAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		BulkUpdateActiveStatusCommand command =
			new(
				[],
				IsActive: true,
				ModifiedBy: "admin");

		IIdentityCacheService identityCache =
			Substitute.For<IIdentityCacheService>();

		// Act
		long result =
			await BulkUpdateActiveStatusCommandHandler.HandleAsync(
				command,
				context,
				identityCache,
				TimeProvider,
				CancellationToken.None);

		// Assert
		result.ShouldBe(0);
	}

	private static async Task<ApplicationUser> CreateUserAsync(
		UserManager<ApplicationUser> userManager,
		int index,
		bool isActive)
	{
		string uniqueId =
			$"{Guid.NewGuid():N}_{index}";

		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithUsername($"bulkuser_{uniqueId}")
				.WithEmail($"bulkuser_{uniqueId}@example.com")
				.WithIsActive(isActive)
				.Build();

		IdentityResult result =
			await userManager.CreateAsync(user, "TestPassword123!");

		result.Succeeded.ShouldBeTrue();
		return user;
	}
}