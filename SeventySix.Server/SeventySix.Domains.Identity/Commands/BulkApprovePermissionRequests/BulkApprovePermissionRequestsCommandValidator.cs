// <copyright file="BulkApprovePermissionRequestsCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity.Commands.BulkApprovePermissionRequests;

/// <summary>
/// FluentValidation validator for BulkApprovePermissionRequestsCommand.
/// Validates bulk permission approval requests.
/// </summary>
public class BulkApprovePermissionRequestsCommandValidator
	: AbstractValidator<BulkApprovePermissionRequestsCommand>
{
	/// <summary>
	/// Initializes a new instance of the
	/// <see cref="BulkApprovePermissionRequestsCommandValidator"/> class.
	/// </summary>
	public BulkApprovePermissionRequestsCommandValidator()
	{
		RuleFor(command => command.RequestIds)
			.NotNull()
			.WithMessage("At least one request ID is required")
			.Must(ids => ids != null && ids.Any())
			.WithMessage("At least one request ID is required")
			.Must(ids => ids == null || ids.All(id => id > 0))
			.WithMessage("All request IDs must be greater than zero");
	}
}