// <copyright file="PermissionRequestServiceApprovalTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.Identity;
using Shouldly;

namespace SeventySix.Tests.Identity.Services;

/// <summary>
/// Unit tests for PermissionRequestService approval and rejection methods.
/// Focus: Business logic validation (80/20 - high value tests only).
/// </summary>
public class PermissionRequestServiceApprovalTests
{
	private readonly IPermissionRequestRepository PermissionRequestRepository =
		Substitute.For<IPermissionRequestRepository>();

	private readonly IUserRepository UserRepository =
		Substitute.For<IUserRepository>();

	private readonly IOptions<WhitelistedPermissionSettings> WhitelistedOptions =
		Options.Create(new WhitelistedPermissionSettings());

	private PermissionRequestService Service => new(
		PermissionRequestRepository,
		UserRepository,
		WhitelistedOptions);

	#region ApproveRequestAsync

	[Fact]
	public async Task ApproveRequestAsync_AddsRoleAndDeletesRequest_WhenFoundAsync()
	{
		// Arrange
		PermissionRequest request =
			new()
			{
				Id = 1,
				UserId = 10,
				RequestedRoleId = 1,
				RequestedRole = new SecurityRole { Id = 1, Name = "Developer" }
			};

		PermissionRequestRepository
			.GetByIdAsync(1, Arg.Any<CancellationToken>())
			.Returns(request);

		// Act
		bool result =
			await Service.ApproveRequestAsync(1);

		// Assert
		result.ShouldBeTrue();
		await UserRepository
			.Received(1)
			.AddRoleAsync(
				10,
				"Developer",
				Arg.Any<CancellationToken>());
		await PermissionRequestRepository
			.Received(1)
			.DeleteAsync(
				1,
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task ApproveRequestAsync_ReturnsFalse_WhenRequestNotFoundAsync()
	{
		// Arrange
		PermissionRequestRepository
			.GetByIdAsync(1, Arg.Any<CancellationToken>())
			.Returns((PermissionRequest?)null);

		// Act
		bool result =
			await Service.ApproveRequestAsync(1);

		// Assert
		result.ShouldBeFalse();
		await UserRepository
			.DidNotReceive()
			.AddRoleAsync(
				Arg.Any<int>(),
				Arg.Any<string>(),
				Arg.Any<CancellationToken>());
		await PermissionRequestRepository
			.DidNotReceive()
			.DeleteAsync(
				Arg.Any<int>(),
				Arg.Any<CancellationToken>());
	}

	#endregion

	#region RejectRequestAsync

	[Fact]
	public async Task RejectRequestAsync_DeletesRequest_WhenFoundAsync()
	{
		// Arrange
		PermissionRequest request =
			new()
			{
				Id = 1,
				UserId = 10,
				RequestedRoleId = 1,
				RequestedRole = new SecurityRole { Id = 1, Name = "Developer" }
			};

		PermissionRequestRepository
			.GetByIdAsync(1, Arg.Any<CancellationToken>())
			.Returns(request);

		// Act
		bool result =
			await Service.RejectRequestAsync(1);

		// Assert
		result.ShouldBeTrue();
		await UserRepository
			.DidNotReceive()
			.AddRoleAsync(
				Arg.Any<int>(),
				Arg.Any<string>(),
				Arg.Any<CancellationToken>());
		await PermissionRequestRepository
			.Received(1)
			.DeleteAsync(
				1,
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task RejectRequestAsync_ReturnsFalse_WhenRequestNotFoundAsync()
	{
		// Arrange
		PermissionRequestRepository
			.GetByIdAsync(1, Arg.Any<CancellationToken>())
			.Returns((PermissionRequest?)null);

		// Act
		bool result =
			await Service.RejectRequestAsync(1);

		// Assert
		result.ShouldBeFalse();
		await PermissionRequestRepository
			.DidNotReceive()
			.DeleteAsync(
				Arg.Any<int>(),
				Arg.Any<CancellationToken>());
	}

	#endregion

	#region ApproveRequestsAsync

	[Fact]
	public async Task ApproveRequestsAsync_AddsRolesAndDeletesRequests_ForAllFoundAsync()
	{
		// Arrange
		List<PermissionRequest> requests =
		[
			new() { Id = 1, UserId = 10, RequestedRoleId = 1, RequestedRole = new SecurityRole { Id = 1, Name = "Developer" } },
			new() { Id = 2, UserId = 20, RequestedRoleId = 2, RequestedRole = new SecurityRole { Id = 2, Name = "Admin" } }
		];

		PermissionRequestRepository
			.GetByIdsAsync(Arg.Any<IEnumerable<int>>(), Arg.Any<CancellationToken>())
			.Returns(requests);

		// Act
		int result =
			await Service.ApproveRequestsAsync([1, 2]);

		// Assert
		result.ShouldBe(2);
		await UserRepository
			.Received(1)
			.AddRoleAsync(
				10,
				"Developer",
				Arg.Any<CancellationToken>());
		await UserRepository
			.Received(1)
			.AddRoleAsync(
				20,
				"Admin",
				Arg.Any<CancellationToken>());
		await PermissionRequestRepository
			.Received(1)
			.DeleteRangeAsync(
				Arg.Is<IEnumerable<int>>(ids => ids.Contains(1) && ids.Contains(2)),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task ApproveRequestsAsync_ReturnsZero_WhenNoRequestsFoundAsync()
	{
		// Arrange
		PermissionRequestRepository
			.GetByIdsAsync(Arg.Any<IEnumerable<int>>(), Arg.Any<CancellationToken>())
			.Returns([]);

		// Act
		int result =
			await Service.ApproveRequestsAsync([1, 2, 3]);

		// Assert
		result.ShouldBe(0);
		await UserRepository
			.DidNotReceive()
			.AddRoleAsync(
				Arg.Any<int>(),
				Arg.Any<string>(),
				Arg.Any<CancellationToken>());
	}

	#endregion

	#region RejectRequestsAsync

	[Fact]
	public async Task RejectRequestsAsync_DeletesAllRequests_WithoutAddingRolesAsync()
	{
		// Arrange - we only need to verify delete is called, not that requests exist

		// Act
		int result =
			await Service.RejectRequestsAsync([1, 2, 3]);

		// Assert
		result.ShouldBe(3);
		await UserRepository
			.DidNotReceive()
			.AddRoleAsync(
				Arg.Any<int>(),
				Arg.Any<string>(),
				Arg.Any<CancellationToken>());
		await PermissionRequestRepository
			.Received(1)
			.DeleteRangeAsync(
				Arg.Is<IEnumerable<int>>(ids => ids.Count() == 3),
				Arg.Any<CancellationToken>());
	}

	#endregion
}