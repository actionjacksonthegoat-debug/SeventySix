// <copyright file="UserQueryValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.BusinessLogic.DTOs.Requests;
using SeventySix.BusinessLogic.Entities;
using SeventySix.BusinessLogic.Validators.Base;

namespace SeventySix.BusinessLogic.Validators;

/// <summary>
/// FluentValidation validator for UserQueryRequest.
/// </summary>
/// <remarks>
/// Inherits ALL validation from BaseQueryValidator.
/// NO custom validation needed (IsActive and IncludeDeleted are bool/bool? - type-safe).
/// SortBy validation automatically uses User entity properties via reflection.
///
/// Common validations (inherited from base):
/// - Excessive database queries (page size, search term length, date range)
/// - Trivial searches (too short)
/// - Invalid sort fields (validated against User entity properties)
///
/// Security Note:
/// - SQL injection is NOT a concern - EF Core LINQ queries are automatically parameterized
/// - No regex validation needed for security - only for business logic
///
/// This demonstrates proper abstraction: base handles everything common.
/// </remarks>
public class UserQueryValidator : BaseQueryValidator<UserQueryRequest, User>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="UserQueryValidator"/> class.
	/// </summary>
	public UserQueryValidator()
		: base() // Call base constructor for ALL validation (Page, PageSize, SearchTerm, DateRange, SortBy)
	{
		// No additional validation needed for UserQueryRequest
		// IsActive and IncludeDeleted are bool/bool? - no validation required
		// SortBy automatically validates against User entity properties (Id, Username, Email, etc.)
	}
}