// <copyright file="LogFilterRequestValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Shared;

namespace SeventySix.Logging;

/// <summary>
/// FluentValidation validator for LogFilterRequest.
/// </summary>
/// <remarks>
/// Inherits common validation from BaseQueryValidator.
/// ONLY validates domain-specific LogLevel property.
/// SortBy validation automatically uses Log entity properties via reflection.
///
/// Validates log filter parameters to prevent:
/// - Invalid log level enum values
///
/// Common validations (inherited from base):
/// - Excessive database queries (date range, page size, search term length)
/// - Trivial searches (too short)
/// - Invalid sort fields
///
/// Security Note:
/// - SQL injection is NOT a concern - EF Core LINQ queries are automatically parameterized
/// - No regex validation needed for security - only for business logic
/// </remarks>
public class LogFilterRequestValidator : BaseQueryValidator<LogFilterRequest, Log>
{
	private static readonly string[] AllowedLogLevels =
		["Verbose", "Debug", "Information", "Warning", "Error", "Fatal"];

	/// <summary>
	/// Initializes a new instance of the <see cref="LogFilterRequestValidator"/> class.
	/// </summary>
	public LogFilterRequestValidator()
		: base() // Call base constructor for common validation (Page, PageSize, SearchTerm, DateRange, SortBy)
	{
		// LogLevel validation: Must be valid enum value (ONLY custom validation for Logs domain)
		When(request => !string.IsNullOrWhiteSpace(request.LogLevel), () =>
		{
			RuleFor(request => request.LogLevel)
				.Must(level => AllowedLogLevels.Contains(level!))
				.WithMessage($"LogLevel must be one of: {string.Join(", ", AllowedLogLevels)}");
		});
	}
}