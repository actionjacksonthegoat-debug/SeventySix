// <copyright file="BaseQueryValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Reflection;
using FluentValidation;

namespace SeventySix.Shared;

/// <summary>
/// Base validator for BaseQueryRequest with common validation rules.
/// </summary>
/// <typeparam name="TRequest">The concrete request type inheriting from BaseQueryRequest.</typeparam>
/// <typeparam name="TEntity">The entity type being queried (for SortBy field validation).</typeparam>
/// <remarks>
/// Validates all properties in BaseQueryRequest including pagination, search, date range, and sorting.
/// Uses reflection to automatically validate SortBy against entity properties (convention over configuration).
/// Concrete validators extend this for domain-specific validation.
///
/// Design Patterns:
/// - Template Method: Base validation logic with extension points
/// - Strategy: Different validation rules applied conditionally
///
/// SOLID Principles:
/// - SRP: Only responsible for common query validation
/// - OCP: Open for extension (inheritance), closed for modification
/// - DIP: Depends on FluentValidation abstraction
///
/// Convention Over Configuration:
/// - SortBy validation discovers entity properties via reflection
/// - No manual field lists needed - entity changes automatically reflected
/// - Type-safe validation against actual entity structure
/// </remarks>
public abstract class BaseQueryValidator<TRequest, TEntity> : AbstractValidator<TRequest>
	where TRequest : BaseQueryRequest
	where TEntity : class
{
	/// <summary>
	/// Maximum allowed search term length.
	/// </summary>
	protected const int MaxSearchTermLength = 200;

	/// <summary>
	/// Minimum required search term length.
	/// </summary>
	protected const int MinSearchTermLength = 3;

	/// <summary>
	/// Maximum allowed date range in days.
	/// </summary>
	protected const int MaxDateRangeDays = 90;

	/// <summary>
	/// Initializes a new instance of the <see cref="BaseQueryValidator{TRequest, TEntity}"/> class.
	/// </summary>
	protected BaseQueryValidator()
	{
		// SearchTerm validation: Prevent trivial/excessive searches (when provided)
		When(request => !string.IsNullOrWhiteSpace(request.SearchTerm), () =>
		{
			RuleFor(request => request.SearchTerm)
				.MinimumLength(MinSearchTermLength)
				.WithMessage($"Search term must be at least {MinSearchTermLength} characters")
				.MaximumLength(MaxSearchTermLength)
				.WithMessage($"Search term must not exceed {MaxSearchTermLength} characters");
		});

		// Pagination validation
		RuleFor(request => request.Page)
			.GreaterThan(0)
			.WithMessage("Page must be greater than 0");

		RuleFor(request => request.PageSize)
			.GreaterThan(0)
			.WithMessage("PageSize must be greater than 0")
			.LessThanOrEqualTo(PaginationConstants.MaxPageSize)
			.WithMessage($"PageSize must not exceed {PaginationConstants.MaxPageSize}");

		// Date range validation: Prevent excessive queries (when both dates provided)
		When(request => request.StartDate.HasValue && request.EndDate.HasValue, () =>
		{
			RuleFor(request => request)
				.Must(req => req.EndDate!.Value >= req.StartDate!.Value)
				.WithMessage("EndDate must be greater than or equal to StartDate")
				.Must(req => (req.EndDate!.Value - req.StartDate!.Value).TotalDays <= MaxDateRangeDays)
				.WithMessage($"Date range must not exceed {MaxDateRangeDays} days");
		});

		// SortBy validation: Automatically validate against entity properties (convention over configuration)
		When(request => !string.IsNullOrWhiteSpace(request.SortBy), () =>
		{
			RuleFor(request => request.SortBy)
				.Must(BeValidEntityProperty)
				.WithMessage(request =>
				{
					string validFields = string.Join(", ", GetEntityPropertyNames());
					return $"SortBy must be one of the following fields: {validFields}";
				});
		});
	}

	/// <summary>
	/// Validates that the sort field exists as a property on the entity.
	/// </summary>
	/// <param name="sortBy">The field name to validate.</param>
	/// <returns>True if the field exists on TEntity; otherwise false.</returns>
	/// <remarks>
	/// Uses reflection to discover entity properties at runtime.
	/// Convention over configuration: no manual field lists needed.
	/// Case-insensitive comparison for user convenience.
	/// </remarks>
	private static bool BeValidEntityProperty(string? sortBy)
	{
		if (string.IsNullOrWhiteSpace(sortBy))
		{
			return true; // Null/empty handled by separate validation
		}

		PropertyInfo[] properties = typeof(TEntity).GetProperties(BindingFlags.Public | BindingFlags.Instance);
		return properties.Any(p => p.Name.Equals(sortBy, StringComparison.OrdinalIgnoreCase));
	}

	/// <summary>
	/// Gets all public property names from the entity for error messages.
	/// </summary>
	/// <returns>Array of property names.</returns>
	/// <remarks>
	/// Sorted alphabetically for consistent error messages.
	/// Used to provide helpful feedback when invalid SortBy value provided.
	/// </remarks>
	private static string[] GetEntityPropertyNames()
	{
		PropertyInfo[] properties = typeof(TEntity).GetProperties(BindingFlags.Public | BindingFlags.Instance);
		return properties.Select(p => p.Name).OrderBy(n => n).ToArray();
	}
}