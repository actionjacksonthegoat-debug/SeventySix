// <copyright file="RejectPermissionRequestCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.Identity;
using SeventySix.Identity.Commands.RejectPermissionRequest;
using SeventySix.Shared.POCOs;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Commands.RejectPermissionRequest;

/// <summary>
/// Unit tests for <see cref="RejectPermissionRequestCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on happy path and validation paths.
/// Simple handler that deletes permission requests - tests verify proper deletion.
/// </remarks>
public class RejectPermissionRequestCommandHandlerTests
{
	private readonly IPermissionRequestRepository PermissionRequestRepository;

	/// <summary>
	/// Initializes a new instance of the <see cref="RejectPermissionRequestCommandHandlerTests"/> class.
	/// </summary>
	public RejectPermissionRequestCommandHandlerTests()
	{
		PermissionRequestRepository =
			Substitute.For<IPermissionRequestRepository>();
	}

	/// <summary>
	/// Tests successful rejection (deletion) of a permission request.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ValidRequest_DeletesSuccessfullyAsync()
	{
		// Arrange
		const long RequestId = 1;
		const long UserId = 42;

		PermissionRequest request =
			CreateTestRequest(
				RequestId,
				UserId,
				"Developer");

		RejectPermissionRequestCommand command =
			new(RequestId: RequestId);

		PermissionRequestRepository
			.GetByIdAsync(
				RequestId,
				Arg.Any<CancellationToken>())
			.Returns(request);

		// Act
		Result result =
			await RejectPermissionRequestCommandHandler.HandleAsync(
				command,
				PermissionRequestRepository,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeTrue();

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
		RejectPermissionRequestCommand command =
			new(RequestId: NonExistentRequestId);

		PermissionRequestRepository
			.GetByIdAsync(
				NonExistentRequestId,
				Arg.Any<CancellationToken>())
			.Returns((PermissionRequest?)null);

		// Act
		Result result =
			await RejectPermissionRequestCommandHandler.HandleAsync(
				command,
				PermissionRequestRepository,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error!.ShouldContain("not found");

		// Verify DeleteAsync was NOT called
		await PermissionRequestRepository
			.DidNotReceive()
			.DeleteAsync(
				Arg.Any<long>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that CancellationToken is properly passed through.
	/// </summary>
	[Fact]
	public async Task HandleAsync_Always_PassesCancellationTokenAsync()
	{
		// Arrange
		const long RequestId = 1;

		PermissionRequest request =
			CreateTestRequest(
				RequestId,
				42,
				"Developer");

		RejectPermissionRequestCommand command =
			new(RequestId: RequestId);

		using CancellationTokenSource cancellationTokenSource =
			new();

		CancellationToken cancellationToken =
			cancellationTokenSource.Token;

		PermissionRequestRepository
			.GetByIdAsync(
				RequestId,
				Arg.Any<CancellationToken>())
			.Returns(request);

		// Act
		await RejectPermissionRequestCommandHandler.HandleAsync(
			command,
			PermissionRequestRepository,
			cancellationToken);

		// Assert - Verify CancellationToken was passed through
		await PermissionRequestRepository
			.Received(1)
			.GetByIdAsync(
				RequestId,
				cancellationToken);

		await PermissionRequestRepository
			.Received(1)
			.DeleteAsync(
				RequestId,
				cancellationToken);
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
}