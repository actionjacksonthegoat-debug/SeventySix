// <copyright file="BulkUpdateActiveStatusCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Commands.BulkUpdateActiveStatus;

/// <summary>
/// Unit tests for <see cref="BulkUpdateActiveStatusCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on bulk operation behavior.
/// </remarks>
public class BulkUpdateActiveStatusCommandHandlerTests
{
	private readonly UserManager<ApplicationUser> UserManager;

	/// <summary>
	/// Initializes a new instance of the <see cref="BulkUpdateActiveStatusCommandHandlerTests"/> class.
	/// </summary>
	public BulkUpdateActiveStatusCommandHandlerTests()
	{
		UserManager =
			IdentityMockFactory.CreateUserManager();
	}

	/// <summary>
	/// Tests successful activation of multiple users.
	/// </summary>
	[Fact]
	public async Task HandleAsync_MultipleUsers_ActivatesAllAsync()
	{
		// Arrange
		List<long> userIds =
			[1, 2, 3];

		ApplicationUser user1 =
			CreateUser(1, isActive: false);
		ApplicationUser user2 =
			CreateUser(2, isActive: false);
		ApplicationUser user3 =
			CreateUser(3, isActive: false);

		BulkUpdateActiveStatusCommand command =
			new(userIds, IsActive: true, ModifiedBy: "admin");

		UserManager.FindByIdAsync("1").Returns(user1);
		UserManager.FindByIdAsync("2").Returns(user2);
		UserManager.FindByIdAsync("3").Returns(user3);

		UserManager
			.UpdateAsync(Arg.Any<ApplicationUser>())
			.Returns(IdentityResult.Success);

		// Act
		long result =
			await BulkUpdateActiveStatusCommandHandler.HandleAsync(
				command,
				UserManager,
				CancellationToken.None);

		// Assert
		result.ShouldBe(3);
		user1.IsActive.ShouldBeTrue();
		user2.IsActive.ShouldBeTrue();
		user3.IsActive.ShouldBeTrue();
	}

	/// <summary>
	/// Tests successful deactivation of multiple users.
	/// </summary>
	[Fact]
	public async Task HandleAsync_MultipleUsers_DeactivatesAllAsync()
	{
		// Arrange
		List<long> userIds =
			[1, 2];

		ApplicationUser user1 =
			CreateUser(1, isActive: true);
		ApplicationUser user2 =
			CreateUser(2, isActive: true);

		BulkUpdateActiveStatusCommand command =
			new(userIds, IsActive: false, ModifiedBy: "admin");

		UserManager.FindByIdAsync("1").Returns(user1);
		UserManager.FindByIdAsync("2").Returns(user2);

		UserManager
			.UpdateAsync(Arg.Any<ApplicationUser>())
			.Returns(IdentityResult.Success);

		// Act
		long result =
			await BulkUpdateActiveStatusCommandHandler.HandleAsync(
				command,
				UserManager,
				CancellationToken.None);

		// Assert
		result.ShouldBe(2);
		user1.IsActive.ShouldBeFalse();
		user2.IsActive.ShouldBeFalse();
	}

	/// <summary>
	/// Tests that non-existent users are skipped.
	/// </summary>
	[Fact]
	public async Task HandleAsync_SomeUsersNotFound_SkipsThemAsync()
	{
		// Arrange
		List<long> userIds =
			[1, 999, 2];

		ApplicationUser user1 =
			CreateUser(1, isActive: false);
		ApplicationUser user2 =
			CreateUser(2, isActive: false);

		BulkUpdateActiveStatusCommand command =
			new(userIds, IsActive: true, ModifiedBy: "admin");

		UserManager.FindByIdAsync("1").Returns(user1);
		UserManager.FindByIdAsync("999").Returns((ApplicationUser?)null);
		UserManager.FindByIdAsync("2").Returns(user2);

		UserManager
			.UpdateAsync(Arg.Any<ApplicationUser>())
			.Returns(IdentityResult.Success);

		// Act
		long result =
			await BulkUpdateActiveStatusCommandHandler.HandleAsync(
				command,
				UserManager,
				CancellationToken.None);

		// Assert
		result.ShouldBe(2);
	}

	/// <summary>
	/// Tests that update failures are not counted.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UpdateFails_DoesNotCountAsync()
	{
		// Arrange
		List<long> userIds =
			[1, 2];

		ApplicationUser user1 =
			CreateUser(1, isActive: false);
		ApplicationUser user2 =
			CreateUser(2, isActive: false);

		BulkUpdateActiveStatusCommand command =
			new(userIds, IsActive: true, ModifiedBy: "admin");

		UserManager.FindByIdAsync("1").Returns(user1);
		UserManager.FindByIdAsync("2").Returns(user2);

		UserManager
			.UpdateAsync(user1)
			.Returns(IdentityResult.Success);
		UserManager
			.UpdateAsync(user2)
			.Returns(IdentityResult.Failed(new IdentityError { Description = "Failed" }));

		// Act
		long result =
			await BulkUpdateActiveStatusCommandHandler.HandleAsync(
				command,
				UserManager,
				CancellationToken.None);

		// Assert
		result.ShouldBe(1);
	}

	/// <summary>
	/// Tests that empty user list returns zero.
	/// </summary>
	[Fact]
	public async Task HandleAsync_EmptyUserList_ReturnsZeroAsync()
	{
		// Arrange
		BulkUpdateActiveStatusCommand command =
			new(
				[],
				IsActive: true,
				ModifiedBy: "admin");

		// Act
		long result =
			await BulkUpdateActiveStatusCommandHandler.HandleAsync(
				command,
				UserManager,
				CancellationToken.None);

		// Assert
		result.ShouldBe(0);
	}

	private static ApplicationUser CreateUser(
		long userId,
		bool isActive)
	{
		FakeTimeProvider timeProvider =
			new(TestTimeProviderBuilder.DefaultTime);

		return new UserBuilder(timeProvider)
			.WithId(userId)
			.WithUsername($"user{userId}")
			.WithEmail($"user{userId}@example.com")
			.WithIsActive(isActive)
			.Build();
	}
}