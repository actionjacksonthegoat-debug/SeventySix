// <copyright file="BulkUpdateActiveStatusCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity.Commands.BulkUpdateActiveStatus;

/// <summary>
/// FluentValidation validator for BulkUpdateActiveStatusCommand.
/// Validates bulk user status update requests.
/// </summary>
public sealed class BulkUpdateActiveStatusCommandValidator
	: AbstractValidator<BulkUpdateActiveStatusCommand>
{
	/// <summary>
	/// Initializes a new instance of the
	/// <see cref="BulkUpdateActiveStatusCommandValidator"/> class.
	/// </summary>
	public BulkUpdateActiveStatusCommandValidator()
	{
		RuleFor(command => command.UserIds)
			.NotNull()
			.WithMessage("At least one user ID is required")
			.Must(ids => ids != null && ids.Any())
			.WithMessage("At least one user ID is required")
			.Must(ids => ids == null || ids.All(id => id > 0))
			.WithMessage("All user IDs must be greater than zero");

		RuleFor(command => command.ModifiedBy)
			.NotEmpty()
			.WithMessage("ModifiedBy is required");
	}
}