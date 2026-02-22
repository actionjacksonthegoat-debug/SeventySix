// <copyright file="ApprovePermissionRequestCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using NSubstitute;
using SeventySix.Identity.Commands.ApprovePermissionRequest;
using SeventySix.Shared.Interfaces;
using SeventySix.Shared.POCOs;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Identity.Tests.Commands.ApprovePermissionRequest;

/// <summary>
/// Unit tests for <see cref="ApprovePermissionRequestCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on happy path and critical validation paths.
/// Security-critical: Role elevation operations must be thoroughly tested.
/// </remarks>
public sealed class ApprovePermissionRequestCommandHandlerTests
{
	private readonly IPermissionRequestRepository PermissionRequestRepository;
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly IIdentityCacheService IdentityCache;
	private readonly ITransactionManager TransactionManager;

	/// <summary>
	/// Initializes a new instance of the <see cref="ApprovePermissionRequestCommandHandlerTests"/> class.
	/// </summary>
	public ApprovePermissionRequestCommandHandlerTests()
	{
		PermissionRequestRepository =
			Substitute.For<IPermissionRequestRepository>();
		UserManager =
			IdentityMockFactory.CreateUserManager();
		IdentityCache =
			Substitute.For<IIdentityCacheService>();
		TransactionManager =
			Substitute.For<ITransactionManager>();
		TransactionManager
			.ExecuteInTransactionAsync(
				Arg.Any<Func<CancellationToken, Task<Result>>>(),
				Arg.Any<int>(),
				Arg.Any<CancellationToken>())
			.Returns(
				call =>
				{
					Func<CancellationToken, Task<Result>> operation =
						call.ArgAt<Func<CancellationToken, Task<Result>>>(0);
					return operation(CancellationToken.None);
				});
	}

	/// <summary>
	/// Tests successful approval of a permission request.
	/// Verifies role is added and request is deleted.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ValidRequest_ApprovesSuccessfullyAsync()
	{
		// Arrange
		const long RequestId = 1;
		const long UserId = 42;
		const string RoleName = "Developer";

		PermissionRequest request =
			CreateTestRequest(
				RequestId,
				UserId,
				RoleName);

		ApplicationUser user =
			CreateTestUser(UserId);

		ApprovePermissionRequestCommand command =
			new(RequestId: RequestId);

		PermissionRequestRepository
			.GetByIdAsync(
				RequestId,
				Arg.Any<CancellationToken>())
			.Returns(request);

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns(user);

		UserManager
			.AddToRoleAsync(
				Arg.Any<ApplicationUser>(),
				RoleName)
			.Returns(IdentityResult.Success);

		// Act
		Result result =
			await ApprovePermissionRequestCommandHandler.HandleAsync(
				command,
				PermissionRequestRepository,
				UserManager,
				IdentityCache,
				TransactionManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeTrue();

		await UserManager
			.Received(1)
			.AddToRoleAsync(
				Arg.Is<ApplicationUser>(applicationUser => applicationUser.Id == UserId),
				RoleName);

		await PermissionRequestRepository
			.Received(1)
			.DeleteAsync(
				RequestId,
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests failure when permission request is not found.
	/// </summary>
	[Fact]
	public async Task HandleAsync_RequestNotFound_ReturnsFailureAsync()
	{
		// Arrange
		const long NonExistentRequestId = 999;
		ApprovePermissionRequestCommand command =
			new(RequestId: NonExistentRequestId);

		PermissionRequestRepository
			.GetByIdAsync(
				NonExistentRequestId,
				Arg.Any<CancellationToken>())
			.Returns((PermissionRequest?)null);

		// Act
		Result result =
			await ApprovePermissionRequestCommandHandler.HandleAsync(
				command,
				PermissionRequestRepository,
				UserManager,
				IdentityCache,
				TransactionManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error!.ShouldContain("not found");
	}

	/// <summary>
	/// Tests failure when user is not found.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserNotFound_ReturnsFailureAsync()
	{
		// Arrange
		const long RequestId = 1;
		const long UserId = 42;

		PermissionRequest request =
			CreateTestRequest(
				RequestId,
				UserId,
				"Developer");

		ApprovePermissionRequestCommand command =
			new(RequestId: RequestId);

		PermissionRequestRepository
			.GetByIdAsync(
				RequestId,
				Arg.Any<CancellationToken>())
			.Returns(request);

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns((ApplicationUser?)null);

		// Act
		Result result =
			await ApprovePermissionRequestCommandHandler.HandleAsync(
				command,
				PermissionRequestRepository,
				UserManager,
				IdentityCache,
				TransactionManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error!.ShouldContain("User");
		result.Error!.ShouldContain("not found");
	}

	/// <summary>
	/// Tests failure when adding role fails.
	/// </summary>
	[Fact]
	public async Task HandleAsync_AddToRoleFails_ReturnsFailureAsync()
	{
		// Arrange
		const long RequestId = 1;
		const long UserId = 42;
		const string RoleName = "Developer";

		PermissionRequest request =
			CreateTestRequest(
				RequestId,
				UserId,
				RoleName);

		ApplicationUser user =
			CreateTestUser(UserId);

		ApprovePermissionRequestCommand command =
			new(RequestId: RequestId);

		PermissionRequestRepository
			.GetByIdAsync(
				RequestId,
				Arg.Any<CancellationToken>())
			.Returns(request);

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns(user);

		UserManager
			.AddToRoleAsync(
				Arg.Any<ApplicationUser>(),
				RoleName)
			.Returns(
				IdentityResult.Failed(
					new IdentityError
					{
						Code = "RoleError",
						Description = "User is already in this role",
					}));

		// Act
		Result result =
			await ApprovePermissionRequestCommandHandler.HandleAsync(
				command,
				PermissionRequestRepository,
				UserManager,
				IdentityCache,
				TransactionManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error!.ShouldContain("Failed to add role");
		result.Error!.ShouldContain("already in this role");

		// Verify request was NOT deleted on failure
		await PermissionRequestRepository
			.DidNotReceive()
			.DeleteAsync(
				Arg.Any<long>(),
				Arg.Any<CancellationToken>());
	}

	private static PermissionRequest CreateTestRequest(
		long requestId,
		long userId,
		string roleName) =>
		new()
		{
			Id = requestId,
			UserId = userId,
			RequestedRole =
				new ApplicationRole
				{
					Name = roleName,
				},
			RequestMessage = "Please grant me access",
			CreatedBy = "testuser",
			CreateDate = default,
		};

	private static ApplicationUser CreateTestUser(long userId) =>
		new()
		{
			Id = userId,
			UserName = "testuser",
			Email = "test@example.com",
			IsActive = true,
		};
}