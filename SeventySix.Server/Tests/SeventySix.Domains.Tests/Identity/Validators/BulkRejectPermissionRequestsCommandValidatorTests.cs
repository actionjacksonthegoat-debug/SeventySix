// <copyright file="BulkRejectPermissionRequestsCommandValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity.Commands.BulkRejectPermissionRequests;

namespace SeventySix.Domains.Tests.Identity.Validators;

/// <summary>
/// Unit tests for BulkRejectPermissionRequestsCommandValidator.
/// Tests validation rules for bulk rejection requests.
/// </summary>
/// <remarks>
/// Coverage Focus (80/20):
/// - RequestIds validation (required, not empty, positive values)
/// </remarks>
public class BulkRejectPermissionRequestsCommandValidatorTests
{
	private readonly BulkRejectPermissionRequestsCommandValidator Validator = new();

	[Fact]
	public void RequestIds_ShouldHaveError_WhenNullAsync()
	{
		// Arrange
		BulkRejectPermissionRequestsCommand command =
			new(RequestIds: null!);

		// Act
		TestValidationResult<BulkRejectPermissionRequestsCommand> result =
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
		BulkRejectPermissionRequestsCommand command =
			new(RequestIds: []);

		// Act
		TestValidationResult<BulkRejectPermissionRequestsCommand> result =
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
		BulkRejectPermissionRequestsCommand command =
			new(RequestIds: [1, 0, 3]);

		// Act
		TestValidationResult<BulkRejectPermissionRequestsCommand> result =
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
		BulkRejectPermissionRequestsCommand command =
			new(RequestIds: [1, 2, 3]);

		// Act
		TestValidationResult<BulkRejectPermissionRequestsCommand> result =
			Validator.TestValidate(command);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}
}