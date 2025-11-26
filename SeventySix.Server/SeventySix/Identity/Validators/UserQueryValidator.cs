// <copyright file="UserQueryValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Shared;

namespace SeventySix.Identity;

/// <summary>
/// Validator for <see cref="UserQueryRequest"/>.
/// Ensures query parameters are valid before executing database queries.
/// </summary>
public class UserQueryValidator : AbstractValidator<UserQueryRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="UserQueryValidator"/> class.
	/// </summary>
	public UserQueryValidator()
	{
		RuleFor(x => x.Page)
			.GreaterThan(0)
			.WithMessage("Page must be greater than 0");

		RuleFor(x => x.PageSize)
			.InclusiveBetween(1, 100)
			.WithMessage("Page size must be between 1 and 100");

		RuleFor(x => x.SearchTerm)
			.MaximumLength(100)
			.When(x => !string.IsNullOrWhiteSpace(x.SearchTerm))
			.WithMessage("Search term must not exceed 100 characters");

		RuleFor(x => x.StartDate)
			.LessThanOrEqualTo(x => x.EndDate ?? DateTime.MaxValue)
			.When(x => x.StartDate.HasValue)
			.WithMessage("StartDate must be before or equal to EndDate");
	}
}
