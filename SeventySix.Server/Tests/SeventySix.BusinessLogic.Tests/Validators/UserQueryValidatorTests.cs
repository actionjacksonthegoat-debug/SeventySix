// <copyright file="UserQueryValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.BusinessLogic.DTOs.Requests;
using SeventySix.BusinessLogic.Validators;

namespace SeventySix.BusinessLogic.Tests.Validators;

/// <summary>
/// Unit tests for UserQueryValidator.
/// Tests validation rules for user query requests (80/20 rule - critical paths only).
/// </summary>
/// <remarks>
/// Following TDD principles and 80/20 rule:
/// - Focus on UserQueryRequest-specific validation
/// - Common validation (Page, PageSize, SearchTerm, DateRange, SortBy) tested in BaseQueryValidatorTests
/// - No custom validation needed for UserQueryRequest (IsActive and IncludeDeleted are type-safe)
///
/// Coverage Focus:
/// - Valid request (happy path)
/// - Demonstrates proper inheritance from base validator
/// </remarks>
public class UserQueryValidatorTests
{
	private readonly UserQueryValidator Validator = new();

	[Fact]
	public async Task ValidRequest_PassesValidationAsync()
	{
		// Arrange
		UserQueryRequest request = new()
		{
			SearchTerm = "john doe",
			IsActive = true,
			Page = 1,
			PageSize = 50,
		};

		// Act
		TestValidationResult<UserQueryRequest> result = await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}
}
