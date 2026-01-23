// <copyright file="BulkApprovePermissionRequestsCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Identity.Commands.BulkApprovePermissionRequests;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Commands.BulkApprovePermissionRequests;

/// <summary>
/// Unit tests for <see cref="BulkApprovePermissionRequestsCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on happy path and edge cases.
/// Security-critical: Bulk role elevation operations must be thoroughly tested.
/// </remarks>
public class BulkApprovePermissionRequestsCommandHandlerTests
{
	private readonly IPermissionRequestRepository PermissionRequestRepository;
	private readonly UserManager<ApplicationUser> UserManager;

	/// <summary>
	/// Initializes a new instance of the <see cref="BulkApprovePermissionRequestsCommandHandlerTests"/> class.
	/// </summary>
	public BulkApprovePermissionRequestsCommandHandlerTests()
	{
		PermissionRequestRepository =
			Substitute.For<IPermissionRequestRepository>();
		UserManager =
			IdentityMockFactory.CreateUserManager();
	}

	/// <summary>
	/// Tests successful bulk approval of multiple permission requests.
	/// </summary>
	[Fact]
	public async Task HandleAsync_MultipleRequests_ApprovesAllAndReturnsCountAsync()
	{
		// Arrange
		long[] requestIds =
			[1, 2];

		PermissionRequest request1 =
			CreateTestRequest(1, 42, "Developer");
		PermissionRequest request2 =
			CreateTestRequest(2, 43, "Admin");

		ApplicationUser user1 =
			CreateTestUser(42);
		ApplicationUser user2 =
			CreateTestUser(43);

		BulkApprovePermissionRequestsCommand command =
			new(RequestIds: requestIds);

		PermissionRequestRepository
			.GetByIdsAsync(
				Arg.Any<List<long>>(),
				Arg.Any<CancellationToken>())
			.Returns([request1, request2]);

		UserManager
			.FindByIdAsync("42")
			.Returns(user1);

		UserManager
			.FindByIdAsync("43")
			.Returns(user2);

		UserManager
			.AddToRoleAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string>())
			.Returns(IdentityResult.Success);

		// Act
		int result =
			await BulkApprovePermissionRequestsCommandHandler.HandleAsync(
				command,
				PermissionRequestRepository,
				UserManager,
				CancellationToken.None);

		// Assert
		result.ShouldBe(2);

		await UserManager
			.Received(1)
			.AddToRoleAsync(user1, "Developer");

		await UserManager
			.Received(1)
			.AddToRoleAsync(user2, "Admin");

		await PermissionRequestRepository
			.Received(1)
			.DeleteRangeAsync(
				Arg.Any<List<long>>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that requests for non-existent users are skipped.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserNotFound_SkipsAndContinuesAsync()
	{
		// Arrange
		long[] requestIds =
			[1, 2];

		PermissionRequest request1 =
			CreateTestRequest(1, 42, "Developer");
		PermissionRequest request2 =
			CreateTestRequest(2, 99, "Admin"); // User 99 doesn't exist

		ApplicationUser user1 =
			CreateTestUser(42);

		BulkApprovePermissionRequestsCommand command =
			new(RequestIds: requestIds);

		PermissionRequestRepository
			.GetByIdsAsync(
				Arg.Any<List<long>>(),
				Arg.Any<CancellationToken>())
			.Returns([request1, request2]);

		UserManager
			.FindByIdAsync("42")
			.Returns(user1);

		UserManager
			.FindByIdAsync("99")
			.Returns((ApplicationUser?)null);

		UserManager
			.AddToRoleAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string>())
			.Returns(IdentityResult.Success);

		// Act
		int result =
			await BulkApprovePermissionRequestsCommandHandler.HandleAsync(
				command,
				PermissionRequestRepository,
				UserManager,
				CancellationToken.None);

		// Assert - Only 1 approved (user 99 was skipped)
		result.ShouldBe(1);

		await UserManager
			.Received(1)
			.AddToRoleAsync(user1, "Developer");

		// Verify requests were still deleted (cleanup)
		await PermissionRequestRepository
			.Received(1)
			.DeleteRangeAsync(
				Arg.Any<List<long>>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that failed role additions are counted correctly.
	/// </summary>
	[Fact]
	public async Task HandleAsync_AddToRoleFails_CountsOnlySuccessfulAsync()
	{
		// Arrange
		long[] requestIds =
			[1, 2];

		PermissionRequest request1 =
			CreateTestRequest(1, 42, "Developer");
		PermissionRequest request2 =
			CreateTestRequest(2, 43, "Admin");

		ApplicationUser user1 =
			CreateTestUser(42);
		ApplicationUser user2 =
			CreateTestUser(43);

		BulkApprovePermissionRequestsCommand command =
			new(RequestIds: requestIds);

		PermissionRequestRepository
			.GetByIdsAsync(
				Arg.Any<List<long>>(),
				Arg.Any<CancellationToken>())
			.Returns([request1, request2]);

		UserManager
			.FindByIdAsync("42")
			.Returns(user1);

		UserManager
			.FindByIdAsync("43")
			.Returns(user2);

		// First succeeds, second fails
		UserManager
			.AddToRoleAsync(user1, "Developer")
			.Returns(IdentityResult.Success);

		UserManager
			.AddToRoleAsync(user2, "Admin")
			.Returns(
				IdentityResult.Failed(
					new IdentityError
					{
						Code = "RoleError",
						Description = "User already in role",
					}));

		// Act
		int result =
			await BulkApprovePermissionRequestsCommandHandler.HandleAsync(
				command,
				PermissionRequestRepository,
				UserManager,
				CancellationToken.None);

		// Assert - Only 1 approved (second failed)
		result.ShouldBe(1);

		// Verify requests were still deleted (cleanup)
		await PermissionRequestRepository
			.Received(1)
			.DeleteRangeAsync(
				Arg.Any<List<long>>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that empty array returns zero.
	/// </summary>
	[Fact]
	public async Task HandleAsync_EmptyArray_ReturnsZeroAsync()
	{
		// Arrange
		long[] requestIds = [];

		BulkApprovePermissionRequestsCommand command =
			new(RequestIds: requestIds);

		PermissionRequestRepository
			.GetByIdsAsync(
				Arg.Any<List<long>>(),
				Arg.Any<CancellationToken>())
			.Returns(Enumerable.Empty<PermissionRequest>());

		// Act
		int result =
			await BulkApprovePermissionRequestsCommandHandler.HandleAsync(
				command,
				PermissionRequestRepository,
				UserManager,
				CancellationToken.None);

		// Assert
		result.ShouldBe(0);

		// Verify no role operations attempted
		await UserManager
			.DidNotReceive()
			.AddToRoleAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string>());
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
			CreatedBy = $"testuser{userId}",
			CreateDate = default,
		};

	private static ApplicationUser CreateTestUser(long userId) =>
		new()
		{
			Id = userId,
			UserName = $"testuser{userId}",
			Email = $"test{userId}@example.com",
			IsActive = true,
		};
}
