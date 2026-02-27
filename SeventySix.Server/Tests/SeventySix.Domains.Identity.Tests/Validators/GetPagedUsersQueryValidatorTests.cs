// <copyright file="GetPagedUsersQueryValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity.Queries.GetPagedUsers;
using Shouldly;

namespace SeventySix.Identity.Tests.Validators;

/// <summary>
/// Unit tests for GetPagedUsersQueryValidator.
/// </summary>
/// <remarks>
/// Coverage Focus:
/// - Delegates Request validation to UserQueryValidator
/// - Valid query passes validation
/// - Invalid request fails via delegation
/// </remarks>
public sealed class GetPagedUsersQueryValidatorTests
{
	private readonly GetPagedUsersQueryValidator Validator =
		new(new UserQueryValidator());

	#region Valid Query Tests

	[Fact]
	public async Task ValidQuery_PassesValidationAsync()
	{
		// Arrange
		GetPagedUsersQuery query =
			new(
				new UserQueryRequest
				{
					Page = 1,
					PageSize = 20,
				});

		// Act
		TestValidationResult<GetPagedUsersQuery> result =
			await Validator.TestValidateAsync(query);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public async Task ValidQuery_WithFilters_PassesValidationAsync()
	{
		// Arrange
		GetPagedUsersQuery query =
			new(
				new UserQueryRequest
				{
					Page = 2,
					PageSize = 10,
					IsActive = true,
					IncludeDeleted = false,
				});

		// Act
		TestValidationResult<GetPagedUsersQuery> result =
			await Validator.TestValidateAsync(query);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	#endregion

	#region Delegation Tests

	[Fact]
	public async Task InvalidRequest_PageZero_FailsValidationAsync()
	{
		// Arrange
		GetPagedUsersQuery query =
			new(
				new UserQueryRequest
				{
					Page = 0,
					PageSize = 20,
				});

		// Act
		TestValidationResult<GetPagedUsersQuery> result =
			await Validator.TestValidateAsync(query);

		// Assert
		result.IsValid.ShouldBeFalse();
	}

	#endregion
}