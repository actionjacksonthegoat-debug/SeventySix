// <copyright file="UserQueryValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.DTOs;
using SeventySix.Shared.Validators;

namespace SeventySix.Identity.Queries.GetPagedUsers;

/// <summary>
/// Validator for <see cref="UserQueryRequest"/>.
/// Inherits common validation from <see cref="BaseQueryValidator{TRequest, TEntity}"/>.
/// </summary>
/// <remarks>
/// Extends BaseQueryValidator to get:
/// - Page/PageSize validation
/// - SearchTerm validation (min/max length)
/// - Date range validation (StartDate &lt;= EndDate, max 90 days)
/// - SortBy validation (validates against User entity properties via reflection)
///
/// No additional User-specific validation needed - IsActive and IncludeDeleted are type-safe booleans.
/// </remarks>
public class UserQueryValidator : BaseQueryValidator<UserQueryRequest, User>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="UserQueryValidator"/> class.
	/// </summary>
	public UserQueryValidator()
	{
		// All common validation inherited from BaseQueryValidator
		// No user-specific validation required - IsActive and IncludeDeleted are type-safe booleans
	}
}