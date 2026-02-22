// <copyright file="BulkApprovePermissionRequestsCommandValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity.Commands.BulkApprovePermissionRequests;

namespace SeventySix.Identity.Tests.Validators;

/// <summary>
/// Unit tests for BulkApprovePermissionRequestsCommandValidator.
/// Tests validation rules for bulk approval requests.
/// </summary>
/// <remarks>
/// Coverage Focus (80/20):
/// - RequestIds validation (required, not empty, positive values)
/// </remarks>
public sealed class BulkApprovePermissionRequestsCommandValidatorTests
{
	private readonly BulkApprovePermissionRequestsCommandValidator Validator = new();

	[Fact]
	public void RequestIds_ShouldHaveError_WhenNullAsync()
	{
		// Arrange
		BulkApprovePermissionRequestsCommand command =
			new(RequestIds: null!);

		// Act
		TestValidationResult<BulkApprovePermissionRequestsCommand> result =
			Validator.TestValidate(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(
				command => command.RequestIds)
			.WithErrorMessage("At least one request ID is required");
	}

	[Fact]
	public void RequestIds_ShouldHaveError_WhenEmptyAsync()
	{
		// Arrange
		BulkApprovePermissionRequestsCommand command =
			new(RequestIds: []);

		// Act
		TestValidationResult<BulkApprovePermissionRequestsCommand> result =
			Validator.TestValidate(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(
				command => command.RequestIds)
			.WithErrorMessage("At least one request ID is required");
	}

	[Fact]
	public void RequestIds_ShouldHaveError_WhenContainsZeroAsync()
	{
		// Arrange
		BulkApprovePermissionRequestsCommand command =
			new(RequestIds: [1, 0, 3]);

		// Act
		TestValidationResult<BulkApprovePermissionRequestsCommand> result =
			Validator.TestValidate(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(
				command => command.RequestIds)
			.WithErrorMessage("All request IDs must be greater than zero");
	}

	[Fact]
	public void RequestIds_ShouldHaveError_WhenContainsNegativeAsync()
	{
		// Arrange
		BulkApprovePermissionRequestsCommand command =
			new(RequestIds: [1, -5, 3]);

		// Act
		TestValidationResult<BulkApprovePermissionRequestsCommand> result =
			Validator.TestValidate(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(
				command => command.RequestIds)
			.WithErrorMessage("All request IDs must be greater than zero");
	}

	[Fact]
	public void Command_ShouldBeValid_WhenRequestIdsArePositiveAsync()
	{
		// Arrange
		BulkApprovePermissionRequestsCommand command =
			new(RequestIds: [1, 2, 3]);

		// Act
		TestValidationResult<BulkApprovePermissionRequestsCommand> result =
			Validator.TestValidate(command);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Command_ShouldBeValid_WhenSinglePositiveIdAsync()
	{
		// Arrange
		BulkApprovePermissionRequestsCommand command =
			new(RequestIds: [42]);

		// Act
		TestValidationResult<BulkApprovePermissionRequestsCommand> result =
			Validator.TestValidate(command);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}
}