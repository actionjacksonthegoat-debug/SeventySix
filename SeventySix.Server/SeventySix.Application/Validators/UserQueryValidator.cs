// <copyright file="UserQueryValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Application.DTOs.Requests;

namespace SeventySix.Application.Validators;

/// <summary>
/// Validator for <see cref="UserQueryRequest"/>.
/// Ensures pagination and query parameters are within acceptable ranges.
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
			.WithMessage("Search term cannot exceed 100 characters")
			.When(x => !string.IsNullOrWhiteSpace(x.SearchTerm));

		RuleFor(x => x.SortBy)
			.Must(x => new[] { "username", "email", "createdat", "modifiedat" }.Contains(x.ToLower()))
			.WithMessage("SortBy must be one of: username, email, createdat, modifiedat");
	}
}
