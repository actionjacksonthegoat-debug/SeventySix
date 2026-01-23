// <copyright file="RemoveUserRoleCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Identity.Constants;
using SeventySix.Shared.POCOs;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Commands.RemoveUserRole;

/// <summary>
/// Unit tests for <see cref="RemoveUserRoleCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on happy path and critical security paths.
/// Security-critical: Tests last-admin protection to prevent lockout scenarios.
/// </remarks>
public class RemoveUserRoleCommandHandlerTests
{
	private readonly UserManager<ApplicationUser> UserManager;

	/// <summary>
	/// Initializes a new instance of the <see cref="RemoveUserRoleCommandHandlerTests"/> class.
	/// </summary>
	public RemoveUserRoleCommandHandlerTests()
	{
		UserManager =
			IdentityMockFactory.CreateUserManager();
	}

	/// <summary>
	/// Tests successful removal of a role from a user.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ValidRoleAndUser_RemovesRoleSuccessfullyAsync()
	{
		// Arrange
		const long UserId = 42;
		const string RoleName = RoleConstants.Developer;

		ApplicationUser user =
			CreateTestUser(UserId);

		RemoveUserRoleCommand command =
			new(UserId: UserId, Role: RoleName);

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns(user);

		UserManager
			.GetRolesAsync(user)
			.Returns([RoleName]);

		UserManager
			.RemoveFromRoleAsync(user, RoleName)
			.Returns(IdentityResult.Success);

		// Act
		Result result =
			await RemoveUserRoleCommandHandler.HandleAsync(
				command,
				UserManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeTrue();

		await UserManager
			.Received(1)
			.RemoveFromRoleAsync(user, RoleName);
	}

	/// <summary>
	/// Tests failure when user is not found.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserNotFound_ReturnsFailureAsync()
	{
		// Arrange
		const long NonExistentUserId = 999;
		const string RoleName = RoleConstants.Developer;

		RemoveUserRoleCommand command =
			new(UserId: NonExistentUserId, Role: RoleName);

		UserManager
			.FindByIdAsync(NonExistentUserId.ToString())
			.Returns((ApplicationUser?)null);

		// Act
		Result result =
			await RemoveUserRoleCommandHandler.HandleAsync(
				command,
				UserManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error!.ShouldContain("not found");
	}

	/// <summary>
	/// Tests failure when user doesn't have the specified role.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserDoesNotHaveRole_ReturnsFailureAsync()
	{
		// Arrange
		const long UserId = 42;
		const string RoleName = RoleConstants.Developer;

		ApplicationUser user =
			CreateTestUser(UserId);

		RemoveUserRoleCommand command =
			new(UserId: UserId, Role: RoleName);

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns(user);

		UserManager
			.GetRolesAsync(user)
			.Returns([RoleConstants.User]); // User has different role

		// Act
		Result result =
			await RemoveUserRoleCommandHandler.HandleAsync(
				command,
				UserManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error!.ShouldContain("does not have role");

		// Verify RemoveFromRoleAsync was NOT called
		await UserManager
			.DidNotReceive()
			.RemoveFromRoleAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string>());
	}

	/// <summary>
	/// Tests that removing Admin role from the last admin throws LastAdminException.
	/// This is critical security behavior to prevent system lockout.
	/// </summary>
	[Fact]
	public async Task HandleAsync_LastAdmin_ThrowsLastAdminExceptionAsync()
	{
		// Arrange
		const long LastAdminUserId = 1;

		ApplicationUser lastAdmin =
			CreateTestUser(LastAdminUserId);

		RemoveUserRoleCommand command =
			new(UserId: LastAdminUserId, Role: RoleConstants.Admin);

		UserManager
			.FindByIdAsync(LastAdminUserId.ToString())
			.Returns(lastAdmin);

		UserManager
			.GetRolesAsync(lastAdmin)
			.Returns([RoleConstants.Admin]);

		// Return only this user as an admin (last admin)
		UserManager
			.GetUsersInRoleAsync(RoleConstants.Admin)
			.Returns([lastAdmin]);

		// Act & Assert
		await Should.ThrowAsync<LastAdminException>(
			async () => await RemoveUserRoleCommandHandler.HandleAsync(
				command,
				UserManager,
				CancellationToken.None));

		// Verify RemoveFromRoleAsync was NOT called
		await UserManager
			.DidNotReceive()
			.RemoveFromRoleAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string>());
	}

	/// <summary>
	/// Tests that removing Admin role succeeds when other admins exist.
	/// </summary>
	[Fact]
	public async Task HandleAsync_AdminWithOtherAdmins_RemovesSuccessfullyAsync()
	{
		// Arrange
		const long AdminUserId = 42;
		const long OtherAdminUserId = 99;

		ApplicationUser adminUser =
			CreateTestUser(AdminUserId);

		ApplicationUser otherAdmin =
			CreateTestUser(OtherAdminUserId);

		RemoveUserRoleCommand command =
			new(UserId: AdminUserId, Role: RoleConstants.Admin);

		UserManager
			.FindByIdAsync(AdminUserId.ToString())
			.Returns(adminUser);

		UserManager
			.GetRolesAsync(adminUser)
			.Returns([RoleConstants.Admin]);

		// Return multiple admins (safe to remove one)
		UserManager
			.GetUsersInRoleAsync(RoleConstants.Admin)
			.Returns([adminUser, otherAdmin]);

		UserManager
			.RemoveFromRoleAsync(adminUser, RoleConstants.Admin)
			.Returns(IdentityResult.Success);

		// Act
		Result result =
			await RemoveUserRoleCommandHandler.HandleAsync(
				command,
				UserManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeTrue();

		await UserManager
			.Received(1)
			.RemoveFromRoleAsync(adminUser, RoleConstants.Admin);
	}

	/// <summary>
	/// Tests failure when Identity RemoveFromRoleAsync fails.
	/// </summary>
	[Fact]
	public async Task HandleAsync_RemoveFromRoleFails_ReturnsFailureAsync()
	{
		// Arrange
		const long UserId = 42;
		const string RoleName = RoleConstants.Developer;

		ApplicationUser user =
			CreateTestUser(UserId);

		RemoveUserRoleCommand command =
			new(UserId: UserId, Role: RoleName);

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns(user);

		UserManager
			.GetRolesAsync(user)
			.Returns([RoleName]);

		UserManager
			.RemoveFromRoleAsync(user, RoleName)
			.Returns(
				IdentityResult.Failed(
					new IdentityError
					{
						Code = "RoleError",
						Description = "Cannot remove role due to constraint",
					}));

		// Act
		Result result =
			await RemoveUserRoleCommandHandler.HandleAsync(
				command,
				UserManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error!.ShouldContain("constraint");
	}

	private static ApplicationUser CreateTestUser(long userId) =>
		new()
		{
			Id = userId,
			UserName = $"testuser{userId}",
			Email = $"test{userId}@example.com",
			IsActive = true,
		};
}
