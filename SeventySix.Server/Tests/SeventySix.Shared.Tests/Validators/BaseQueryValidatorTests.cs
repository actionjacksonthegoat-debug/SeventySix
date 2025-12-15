// <copyright file="BaseQueryValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using Microsoft.Extensions.Time.Testing;
using SeventySix.Shared.DTOs;
using SeventySix.Shared.Validators;

namespace SeventySix.Shared.Tests.Validators;

/// <summary>
/// Unit tests for BaseQueryValidator using a test entity and request.
/// </summary>
/// <remarks>
/// Tests common validation logic for pagination, search, date range, and sorting.
/// Uses a test entity with properties for SortBy validation testing.
/// Follows AAA pattern (Arrange-Act-Assert).
/// </remarks>
public class BaseQueryValidatorTests
{
	private readonly TestQueryValidator Validator = new();

	[Fact]
	public async Task ValidRequest_PassesValidationAsync()
	{
		// Arrange
		TestQueryRequest request = new()
		{
			Page = 1,
			PageSize = 20,
			SearchTerm = "test",
			SortBy = "Id"
		};

		// Act
		TestValidationResult<TestQueryRequest> result = await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public async Task Page_Zero_FailsValidationAsync()
	{
		// Arrange
		TestQueryRequest request = new() { Page = 0 };

		// Act
		TestValidationResult<TestQueryRequest> result = await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(r => r.Page)
			.WithErrorMessage("Page must be greater than 0");
	}

	[Fact]
	public async Task Page_Negative_FailsValidationAsync()
	{
		// Arrange
		TestQueryRequest request = new() { Page = -1 };

		// Act
		TestValidationResult<TestQueryRequest> result = await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(r => r.Page)
			.WithErrorMessage("Page must be greater than 0");
	}

	[Fact]
	public async Task PageSize_Zero_FailsValidationAsync()
	{
		// Arrange
		TestQueryRequest request = new() { PageSize = 0 };

		// Act
		TestValidationResult<TestQueryRequest> result = await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(r => r.PageSize)
			.WithErrorMessage("PageSize must be greater than 0");
	}

	[Fact]
	public async Task PageSize_ExceedsMax_FailsValidationAsync()
	{
		// Arrange
		TestQueryRequest request = new() { PageSize = 150 };

		// Act
		TestValidationResult<TestQueryRequest> result = await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(r => r.PageSize)
			.WithErrorMessage("PageSize must not exceed 100");
	}

	[Fact]
	public async Task SearchTerm_TooShort_FailsValidationAsync()
	{
		// Arrange
		TestQueryRequest request = new() { SearchTerm = "ab" };

		// Act
		TestValidationResult<TestQueryRequest> result = await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(r => r.SearchTerm)
			.WithErrorMessage("Search term must be at least 3 characters");
	}

	[Fact]
	public async Task SearchTerm_TooLong_FailsValidationAsync()
	{
		// Arrange
		TestQueryRequest request = new() { SearchTerm = new string('a', 201) };

		// Act
		TestValidationResult<TestQueryRequest> result = await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(r => r.SearchTerm)
			.WithErrorMessage("Search term must not exceed 200 characters");
	}

	[Fact]
	public async Task SearchTerm_Null_PassesValidationAsync()
	{
		// Arrange
		TestQueryRequest request = new() { SearchTerm = null };

		// Act
		TestValidationResult<TestQueryRequest> result = await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(r => r.SearchTerm);
	}

	[Fact]
	public async Task DateRange_EndBeforeStart_FailsValidationAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		TestQueryRequest request = new()
		{
			StartDate = timeProvider.GetUtcNow().UtcDateTime,
			EndDate = timeProvider.GetUtcNow().UtcDateTime.AddDays(-1)
		};

		// Act
		TestValidationResult<TestQueryRequest> result = await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(r => r)
			.WithErrorMessage("EndDate must be greater than or equal to StartDate");
	}

	[Fact]
	public async Task DateRange_ExceedsMaxDays_FailsValidationAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		TestQueryRequest request = new()
		{
			StartDate = timeProvider.GetUtcNow().UtcDateTime,
			EndDate = timeProvider.GetUtcNow().UtcDateTime.AddDays(91)
		};

		// Act
		TestValidationResult<TestQueryRequest> result = await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(r => r)
			.WithErrorMessage("Date range must not exceed 90 days");
	}

	[Fact]
	public async Task DateRange_Valid_PassesValidationAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		TestQueryRequest request = new()
		{
			StartDate = timeProvider.GetUtcNow().UtcDateTime.AddDays(-30),
			EndDate = timeProvider.GetUtcNow().UtcDateTime
		};

		// Act
		TestValidationResult<TestQueryRequest> result = await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(r => r);
	}

	[Fact]
	public async Task SortBy_ValidEntityProperty_PassesValidationAsync()
	{
		// Arrange
		TestQueryRequest request = new() { SortBy = "Name" };

		// Act
		TestValidationResult<TestQueryRequest> result = await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(r => r.SortBy);
	}

	[Fact]
	public async Task SortBy_InvalidProperty_FailsValidationAsync()
	{
		// Arrange
		TestQueryRequest request = new() { SortBy = "InvalidField" };

		// Act
		TestValidationResult<TestQueryRequest> result = await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(r => r.SortBy)
			.WithErrorMessage("SortBy must be one of the following fields: CreateDate, Id, Name");
	}
}

/// <summary>
/// Test entity with properties for SortBy validation.
/// </summary>
public class TestEntity
{
	public int Id
	{
		get; set;
	}
	public string Name { get; set; } = string.Empty;
	public DateTime CreateDate
	{
		get; set;
	}
}

/// <summary>
/// Test query request inheriting from BaseQueryRequest.
/// </summary>
public record TestQueryRequest : BaseQueryRequest
{
}

/// <summary>
/// Test validator inheriting from BaseQueryValidator.
/// </summary>
public class TestQueryValidator : BaseQueryValidator<TestQueryRequest, TestEntity>
{
}
