// <copyright file="BusinessRuleViolationException.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.BusinessLogic.Exceptions;

/// <summary>
/// Exception thrown when a business rule is violated during domain operations.
/// Represents failures in business logic constraints that are not validation errors.
/// </summary>
/// <remarks>
/// This exception is used for business rule violations that go beyond simple validation:
/// - Complex business constraints
/// - State-dependent rules
/// - Multi-entity invariants
/// - Domain-specific constraints
///
/// Examples of Business Rule Violations:
/// - Cannot create forecast for a date that already has a forecast (uniqueness)
/// - Cannot modify a forecast after it's been published
/// - Temperature changes beyond threshold require approval
/// - Cannot delete a forecast that's referenced by other entities
///
/// Difference from Validation:
/// - Validation: Input format, required fields, value ranges (handled by FluentValidation)
/// - Business Rules: Domain-specific constraints, state rules, invariants (this exception)
///
/// HTTP Mapping:
/// - Maps to 422 Unprocessable Entity in GlobalExceptionMiddleware
/// - Indicates the request was valid but couldn't be processed due to business rules
///
/// Usage Example:
/// <code>
/// if (await forecastExistsForDate(date))
/// {
///     throw new BusinessRuleViolationException(
///         "Unique forecast per date",
///         $"A forecast already exists for {date}"
///     );
/// }
/// </code>
/// </remarks>
public class BusinessRuleViolationException : DomainException
{
	/// <summary>
	/// Initializes a new instance of the <see cref="BusinessRuleViolationException"/> class.
	/// </summary>
	/// <param name="rule">The name or description of the business rule that was violated.</param>
	/// <remarks>
	/// Use this constructor when you want to specify just the rule name.
	/// A standard message will be generated: "Business rule violated: {rule}"
	/// </remarks>
	public BusinessRuleViolationException(string rule)
		: base($"Business rule violated: {rule}")
	{
		Rule = rule;
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="BusinessRuleViolationException"/> class with additional details.
	/// </summary>
	/// <param name="rule">The name or description of the business rule that was violated.</param>
	/// <param name="details">Additional details about why the rule was violated and what action is needed.</param>
	/// <remarks>
	/// Use this constructor to provide detailed information to help users understand and resolve the issue.
	/// The message will be: "Business rule violated: {rule}. {details}"
	/// </remarks>
	public BusinessRuleViolationException(string rule, string details)
		: base($"Business rule violated: {rule}. {details}")
	{
		Rule = rule;
		Details = details;
	}

	/// <summary>
	/// Gets the name or description of the business rule that was violated.
	/// </summary>
	/// <value>
	/// A string identifying the specific business rule.
	/// </value>
	/// <remarks>
	/// This property allows programmatic handling of specific rule violations.
	/// Can be used for logging, metrics, or conditional error handling.
	/// </remarks>
	public string Rule
	{
		get;
	}

	/// <summary>
	/// Gets additional details about the business rule violation.
	/// </summary>
	/// <value>
	/// A string with details about the violation, or null if no details were provided.
	/// </value>
	/// <remarks>
	/// Provides context-specific information about why the rule was violated.
	/// Helps users understand what went wrong and how to fix it.
	/// </remarks>
	public string? Details
	{
		get;
	}
}