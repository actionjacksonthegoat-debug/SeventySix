// <copyright file="BulkRejectPermissionRequestsCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity.Commands.BulkRejectPermissionRequests;

/// <summary>
/// FluentValidation validator for BulkRejectPermissionRequestsCommand.
/// Validates bulk permission rejection requests.
/// </summary>
public sealed class BulkRejectPermissionRequestsCommandValidator
	: AbstractValidator<BulkRejectPermissionRequestsCommand>
{
	/// <summary>
	/// Initializes a new instance of the
	/// <see cref="BulkRejectPermissionRequestsCommandValidator"/> class.
	/// </summary>
	public BulkRejectPermissionRequestsCommandValidator()
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