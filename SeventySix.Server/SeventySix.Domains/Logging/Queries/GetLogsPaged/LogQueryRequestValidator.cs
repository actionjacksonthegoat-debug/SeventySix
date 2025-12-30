// <copyright file="LogQueryRequestValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Shared.Validators;

namespace SeventySix.Logging.Queries.GetLogsPaged;

/// <summary>
/// FluentValidation validator for LogQueryRequest.
/// </summary>
/// <remarks>
/// Inherits common validation from BaseQueryValidator.
/// ONLY validates domain-specific LogLevel property.
/// SortBy validation automatically uses Log entity properties via reflection.
/// </remarks>
public class LogQueryRequestValidator : BaseQueryValidator<LogQueryRequest, Log>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="LogQueryRequestValidator"/> class.
	/// </summary>
	public LogQueryRequestValidator()
		: base()
	{
		When(
			request => !string.IsNullOrWhiteSpace(request.LogLevel),
			() =>
			{
				RuleFor(request => request.LogLevel)
					.Must(level =>
						LogLevelConstants.QueryLevels.Contains(level!))
					.WithMessage(
						$"LogLevel must be one of: {string.Join(", ", LogLevelConstants.QueryLevels)}");
			});
	}
}