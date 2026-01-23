// <copyright file="BulkRejectPermissionRequestsCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.Identity;
using SeventySix.Identity.Commands.BulkRejectPermissionRequests;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Commands.BulkRejectPermissionRequests;

/// <summary>
/// Unit tests for <see cref="BulkRejectPermissionRequestsCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on happy path and edge cases.
/// Bulk operations need tests for empty arrays and proper count returns.
/// </remarks>
public class BulkRejectPermissionRequestsCommandHandlerTests
{
	private readonly IPermissionRequestRepository PermissionRequestRepository;

	/// <summary>
	/// Initializes a new instance of the <see cref="BulkRejectPermissionRequestsCommandHandlerTests"/> class.
	/// </summary>
	public BulkRejectPermissionRequestsCommandHandlerTests()
	{
		PermissionRequestRepository =
			Substitute.For<IPermissionRequestRepository>();
	}

	/// <summary>
	/// Tests successful bulk rejection of multiple permission requests.
	/// </summary>
	[Fact]
	public async Task HandleAsync_MultipleRequests_DeletesAllAndReturnsCountAsync()
	{
		// Arrange
		long[] requestIds =
			[1, 2, 3, 4, 5];

		BulkRejectPermissionRequestsCommand command =
			new(RequestIds: requestIds);

		// Act
		int result =
			await BulkRejectPermissionRequestsCommandHandler.HandleAsync(
				command,
				PermissionRequestRepository,
				CancellationToken.None);

		// Assert
		result.ShouldBe(5);

		await PermissionRequestRepository
			.Received(1)
			.DeleteRangeAsync(
				Arg.Is<List<long>>(
					list => list.Count == 5
						&& list.Contains(1)
						&& list.Contains(5)),
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

		BulkRejectPermissionRequestsCommand command =
			new(RequestIds: requestIds);

		// Act
		int result =
			await BulkRejectPermissionRequestsCommandHandler.HandleAsync(
				command,
				PermissionRequestRepository,
				CancellationToken.None);

		// Assert
		result.ShouldBe(0);

		await PermissionRequestRepository
			.Received(1)
			.DeleteRangeAsync(
				Arg.Is<List<long>>(list => list.Count == 0),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests single request rejection.
	/// </summary>
	[Fact]
	public async Task HandleAsync_SingleRequest_DeletesOneAndReturnsOneAsync()
	{
		// Arrange
		long[] requestIds =
			[42];

		BulkRejectPermissionRequestsCommand command =
			new(RequestIds: requestIds);

		// Act
		int result =
			await BulkRejectPermissionRequestsCommandHandler.HandleAsync(
				command,
				PermissionRequestRepository,
				CancellationToken.None);

		// Assert
		result.ShouldBe(1);

		await PermissionRequestRepository
			.Received(1)
			.DeleteRangeAsync(
				Arg.Is<List<long>>(
					list => list.Count == 1 && list[0] == 42),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that CancellationToken is properly passed through.
	/// </summary>
	[Fact]
	public async Task HandleAsync_Always_PassesCancellationTokenAsync()
	{
		// Arrange
		long[] requestIds =
			[1, 2];

		BulkRejectPermissionRequestsCommand command =
			new(RequestIds: requestIds);

		using CancellationTokenSource cancellationTokenSource =
			new();

		CancellationToken cancellationToken =
			cancellationTokenSource.Token;

		// Act
		await BulkRejectPermissionRequestsCommandHandler.HandleAsync(
			command,
			PermissionRequestRepository,
			cancellationToken);

		// Assert - Verify CancellationToken was passed through
		await PermissionRequestRepository
			.Received(1)
			.DeleteRangeAsync(
				Arg.Any<List<long>>(),
				cancellationToken);
	}
}
