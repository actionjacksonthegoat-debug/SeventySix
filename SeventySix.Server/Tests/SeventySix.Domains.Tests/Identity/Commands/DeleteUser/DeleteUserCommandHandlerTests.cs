// <copyright file="DeleteUserCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Shared.POCOs;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Commands.DeleteUser;

/// <summary>
/// Unit tests for <see cref="DeleteUserCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on happy path and critical validation paths.
/// </remarks>
public class DeleteUserCommandHandlerTests
{
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly TimeProvider TimeProvider;

	/// <summary>
	/// Initializes a new instance of the <see cref="DeleteUserCommandHandlerTests"/> class.
	/// </summary>
	public DeleteUserCommandHandlerTests()
	{
		UserManager =
			IdentityMockFactory.CreateUserManager();
		TimeProvider =
			Substitute.For<TimeProvider>();

		// Setup default time
		TimeProvider
			.GetUtcNow()
			.Returns(DateTimeOffset.UtcNow);
	}

	/// <summary>
	/// Tests successful soft deletion of user.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ValidUser_SoftDeletesSuccessfullyAsync()
	{
		// Arrange
		ApplicationUser user =
			CreateTestUser();
		DeleteUserCommand command =
			new(UserId: user.Id, DeletedBy: "admin");

		UserManager
			.FindByIdAsync(user.Id.ToString())
			.Returns(user);
		UserManager
			.UpdateAsync(Arg.Any<ApplicationUser>())
			.Returns(IdentityResult.Success);

		// Act
		Result result =
			await DeleteUserCommandHandler.HandleAsync(
				command,
				UserManager,
				TimeProvider,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeTrue();
		await UserManager
			.Received(1)
			.UpdateAsync(
				Arg.Is<ApplicationUser>(updatedUser =>
					updatedUser.IsDeleted &&
					!updatedUser.IsActive &&
					updatedUser.DeletedBy == "admin"));
	}

	/// <summary>
	/// Tests deletion failure when user does not exist.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserNotFound_ReturnsFailureAsync()
	{
		// Arrange
		DeleteUserCommand command =
			new(UserId: 999, DeletedBy: "admin");

		UserManager
			.FindByIdAsync(Arg.Any<string>())
			.Returns((ApplicationUser?)null);

		// Act
		Result result =
			await DeleteUserCommandHandler.HandleAsync(
				command,
				UserManager,
				TimeProvider,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error!.ShouldContain("not found");
	}

	/// <summary>
	/// Tests deletion failure when user is already deleted.
	/// </summary>
	[Fact]
	public async Task HandleAsync_AlreadyDeleted_ReturnsFailureAsync()
	{
		// Arrange
		ApplicationUser user =
			CreateTestUser(isDeleted: true);
		DeleteUserCommand command =
			new(UserId: user.Id, DeletedBy: "admin");

		UserManager
			.FindByIdAsync(user.Id.ToString())
			.Returns(user);

		// Act
		Result result =
			await DeleteUserCommandHandler.HandleAsync(
				command,
				UserManager,
				TimeProvider,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error!.ShouldContain("already deleted");
	}

	private static ApplicationUser CreateTestUser(bool isDeleted = false) =>
		new()
		{
			Id = 1,
			UserName = "testuser",
			Email = "test@example.com",
			IsActive = true,
			IsDeleted = isDeleted,
		};
}