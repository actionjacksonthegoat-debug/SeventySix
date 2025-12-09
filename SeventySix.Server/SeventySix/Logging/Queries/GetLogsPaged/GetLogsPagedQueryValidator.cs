// <copyright file="GetLogsPagedQueryValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Logging;

/// <summary>
/// Validator for GetLogsPagedQuery to ensure query parameters are valid.
/// </summary>
public class GetLogsPagedQueryValidator : AbstractValidator<GetLogsPagedQuery>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="GetLogsPagedQueryValidator"/> class.
	/// </summary>
	/// <param name="requestValidator">The validator for LogQueryRequest.</param>
	public GetLogsPagedQueryValidator(
		IValidator<LogQueryRequest> requestValidator)
	{
		RuleFor(query => query.Request)
			.SetValidator(requestValidator);
	}
}
