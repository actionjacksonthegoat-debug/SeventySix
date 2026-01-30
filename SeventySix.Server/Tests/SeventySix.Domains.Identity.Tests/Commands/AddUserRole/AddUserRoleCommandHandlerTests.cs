// <copyright file="AddUserRoleCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Identity.Constants;
using SeventySix.Shared.Interfaces;
using SeventySix.Shared.POCOs;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Identity.Tests.Commands.AddUserRole;

/// <summary>
/// Unit tests for <see cref="AddUserRoleCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on happy path and critical validation paths.
/// Security-critical: Direct role assignment must be thoroughly tested.
/// </remarks>
public class AddUserRoleCommandHandlerTests
{
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly IPermissionRequestRepository PermissionRequestRepository;
	private readonly ICacheInvalidationService CacheInvalidation;

	/// <summary>
	/// Initializes a new instance of the <see cref="AddUserRoleCommandHandlerTests"/> class.
	/// </summary>
	public AddUserRoleCommandHandlerTests()
	{
		UserManager =
			IdentityMockFactory.CreateUserManager();
		PermissionRequestRepository =
			Substitute.For<IPermissionRequestRepository>();
		CacheInvalidation =
			Substitute.For<ICacheInvalidationService>();
	}

	/// <summary>
	/// Tests successful addition of a valid role to a user.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ValidRoleAndUser_AddsRoleSuccessfullyAsync()
	{
		// Arrange
		const long UserId = 42;
		const string RoleName = RoleConstants.Developer;

		ApplicationUser user =
			CreateTestUser(UserId);

		AddUserRoleCommand command =
			new(UserId: UserId, Role: RoleName);

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns(user);

		UserManager
			.GetRolesAsync(user)
			.Returns([]);

		UserManager
			.AddToRoleAsync(user, RoleName)
			.Returns(IdentityResult.Success);

		// Act
		Result result =
			await AddUserRoleCommandHandler.HandleAsync(
				command,
				UserManager,
				PermissionRequestRepository,
				CacheInvalidation,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeTrue();

		await UserManager
			.Received(1)
			.AddToRoleAsync(user, RoleName);

		await PermissionRequestRepository
			.Received(1)
			.DeleteByUserAndRoleAsync(
				UserId,
				RoleName,
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that invalid role name throws ArgumentException.
	/// </summary>
	[Fact]
	public async Task HandleAsync_InvalidRole_ThrowsArgumentExceptionAsync()
	{
		// Arrange
		const long UserId = 42;
		const string InvalidRole = "SuperHacker";

		AddUserRoleCommand command =
			new(UserId: UserId, Role: InvalidRole);

		// Act & Assert
		ArgumentException exception =
			await Should.ThrowAsync<ArgumentException>(
				async () => await AddUserRoleCommandHandler.HandleAsync(
					command,
					UserManager,
					PermissionRequestRepository,
					CacheInvalidation,
					CancellationToken.None));

		exception.Message.ShouldContain("Invalid role");
		exception.Message.ShouldContain(InvalidRole);
	}

	/// <summary>
	/// Tests that non-existent user throws UserNotFoundException.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserNotFound_ThrowsUserNotFoundExceptionAsync()
	{
		// Arrange
		const long NonExistentUserId = 999;
		const string RoleName = RoleConstants.Developer;

		AddUserRoleCommand command =
			new(UserId: NonExistentUserId, Role: RoleName);

		UserManager
			.FindByIdAsync(NonExistentUserId.ToString())
			.Returns((ApplicationUser?)null);

		// Act & Assert
		UserNotFoundException exception =
			await Should.ThrowAsync<UserNotFoundException>(
				async () => await AddUserRoleCommandHandler.HandleAsync(
					command,
					UserManager,
					PermissionRequestRepository,
					CacheInvalidation,
					CancellationToken.None));

		exception.EntityId.ShouldBe(NonExistentUserId);
	}

	/// <summary>
	/// Tests that user already having the role returns failure.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserAlreadyHasRole_ReturnsFailureAsync()
	{
		// Arrange
		const long UserId = 42;
		const string RoleName = RoleConstants.Developer;

		ApplicationUser user =
			CreateTestUser(UserId);

		AddUserRoleCommand command =
			new(UserId: UserId, Role: RoleName);

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns(user);

		UserManager
			.GetRolesAsync(user)
			.Returns([RoleName]);

		// Act
		Result result =
			await AddUserRoleCommandHandler.HandleAsync(
				command,
				UserManager,
				PermissionRequestRepository,
				CacheInvalidation,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error!.ShouldContain("already has role");

		// Verify AddToRoleAsync was NOT called
		await UserManager
			.DidNotReceive()
			.AddToRoleAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string>());
	}

	/// <summary>
	/// Tests failure when Identity AddToRoleAsync fails.
	/// </summary>
	[Fact]
	public async Task HandleAsync_AddToRoleFails_ReturnsFailureAsync()
	{
		// Arrange
		const long UserId = 42;
		const string RoleName = RoleConstants.Developer;

		ApplicationUser user =
			CreateTestUser(UserId);

		AddUserRoleCommand command =
			new(UserId: UserId, Role: RoleName);

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns(user);

		UserManager
			.GetRolesAsync(user)
			.Returns([]);

		UserManager
			.AddToRoleAsync(user, RoleName)
			.Returns(
				IdentityResult.Failed(
					new IdentityError
					{
						Code = "RoleError",
						Description = "Role does not exist in database",
					}));

		// Act
		Result result =
			await AddUserRoleCommandHandler.HandleAsync(
				command,
				UserManager,
				PermissionRequestRepository,
				CacheInvalidation,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error!.ShouldContain("Failed to add role");
		result.Error!.ShouldContain("does not exist");

		// Verify permission request cleanup was NOT called on failure
		await PermissionRequestRepository
			.DidNotReceive()
			.DeleteByUserAndRoleAsync(
				Arg.Any<long>(),
				Arg.Any<string>(),
				Arg.Any<CancellationToken>());
	}

	private static ApplicationUser CreateTestUser(long userId) =>
		new()
		{
			Id = userId,
			UserName = "testuser",
			Email = "test@example.com",
			IsActive = true,
		};
}