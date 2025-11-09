// <copyright file="BusinessRuleViolationException.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Domain.Exceptions;

/// <summary>
/// Exception thrown when a business rule is violated.
/// </summary>
public class BusinessRuleViolationException : DomainException
{
	/// <summary>
	/// Initializes a new instance of the <see cref="BusinessRuleViolationException"/> class.
	/// </summary>
	/// <param name="rule">The business rule that was violated.</param>
	public BusinessRuleViolationException(string rule)
		: base($"Business rule violated: {rule}")
	{
		Rule = rule;
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="BusinessRuleViolationException"/> class.
	/// </summary>
	/// <param name="rule">The business rule that was violated.</param>
	/// <param name="details">Additional details about the violation.</param>
	public BusinessRuleViolationException(string rule, string details)
		: base($"Business rule violated: {rule}. {details}")
	{
		Rule = rule;
		Details = details;
	}

	/// <summary>
	/// Gets the business rule that was violated.
	/// </summary>
	public string Rule
	{
		get;
	}

	/// <summary>
	/// Gets additional details about the violation.
	/// </summary>
	public string? Details
	{
		get;
	}
}
