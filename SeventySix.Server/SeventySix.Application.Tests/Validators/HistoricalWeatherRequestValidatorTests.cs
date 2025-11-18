// <copyright file="HistoricalWeatherRequestValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Application.Validators;
using SeventySix.Application.DTOs.OpenWeather.Common;
using SeventySix.Application.DTOs.Requests;

namespace SeventySix.BusinessLogic.Tests.Validators;

/// <summary>
/// Unit tests for <see cref="HistoricalWeatherRequestValidator"/>.
/// </summary>
public class HistoricalWeatherRequestValidatorTests
{
	private readonly HistoricalWeatherRequestValidator Validator;

	/// <summary>
	/// Initializes a new instance of the <see cref="HistoricalWeatherRequestValidatorTests"/> class.
	/// </summary>
	public HistoricalWeatherRequestValidatorTests()
	{
		Validator = new HistoricalWeatherRequestValidator();
	}

	[Fact]
	public void Validate_ShouldPass_WhenRequestIsValid()
	{
		// Arrange
		long twoDaysAgo = DateTimeOffset.UtcNow.AddDays(-2).ToUnixTimeSeconds();
		HistoricalWeatherRequest request = new()
		{
			Latitude = 40.7128,
			Longitude = -74.0060,
			Timestamp = twoDaysAgo,
			Units = Units.Metric,
			Language = "en",
		};

		// Act
		TestValidationResult<HistoricalWeatherRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Theory]
	[InlineData(-91)]
	[InlineData(91)]
	[InlineData(-100)]
	[InlineData(100)]
	public void Validate_ShouldFail_WhenLatitudeIsOutOfRange(double latitude)
	{
		// Arrange
		long twoDaysAgo = DateTimeOffset.UtcNow.AddDays(-2).ToUnixTimeSeconds();
		HistoricalWeatherRequest request = new()
		{
			Latitude = latitude,
			Longitude = 0,
			Timestamp = twoDaysAgo,
			Language = "en",
		};

		// Act
		TestValidationResult<HistoricalWeatherRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Latitude)
			.WithErrorMessage("Latitude must be between -90 and 90 degrees.");
	}

	[Theory]
	[InlineData(-181)]
	[InlineData(181)]
	[InlineData(-200)]
	[InlineData(200)]
	public void Validate_ShouldFail_WhenLongitudeIsOutOfRange(double longitude)
	{
		// Arrange
		long twoDaysAgo = DateTimeOffset.UtcNow.AddDays(-2).ToUnixTimeSeconds();
		HistoricalWeatherRequest request = new()
		{
			Latitude = 0,
			Longitude = longitude,
			Timestamp = twoDaysAgo,
			Language = "en",
		};

		// Act
		TestValidationResult<HistoricalWeatherRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Longitude)
			.WithErrorMessage("Longitude must be between -180 and 180 degrees.");
	}

	[Theory]
	[InlineData("")]
	[InlineData("e")]
	[InlineData("eng")]
	public void Validate_ShouldFail_WhenLanguageIsInvalid(string language)
	{
		// Arrange
		long twoDaysAgo = DateTimeOffset.UtcNow.AddDays(-2).ToUnixTimeSeconds();
		HistoricalWeatherRequest request = new()
		{
			Latitude = 0,
			Longitude = 0,
			Timestamp = twoDaysAgo,
			Language = language,
		};

		// Act
		TestValidationResult<HistoricalWeatherRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Language)
			.WithErrorMessage("Language must be a 2-character ISO code (e.g., 'en', 'es').");
	}

	[Fact]
	public void Validate_ShouldFail_WhenTimestampIsTooOld()
	{
		// Arrange - 6 days ago (beyond 5-day limit)
		long sixDaysAgo = DateTimeOffset.UtcNow.AddDays(-6).ToUnixTimeSeconds();
		HistoricalWeatherRequest request = new()
		{
			Latitude = 0,
			Longitude = 0,
			Timestamp = sixDaysAgo,
			Language = "en",
		};

		// Act
		TestValidationResult<HistoricalWeatherRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Timestamp)
			.WithErrorMessage("Historical data is only available for the last 5 days.");
	}

	[Fact]
	public void Validate_ShouldFail_WhenTimestampIsInFuture()
	{
		// Arrange - 1 hour in the future
		long futureTime = DateTimeOffset.UtcNow.AddHours(1).ToUnixTimeSeconds();
		HistoricalWeatherRequest request = new()
		{
			Latitude = 0,
			Longitude = 0,
			Timestamp = futureTime,
			Language = "en",
		};

		// Act
		TestValidationResult<HistoricalWeatherRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Timestamp)
			.WithErrorMessage("Historical data is only available for the last 5 days.");
	}

	[Theory]
	[InlineData(-1)] // 1 day ago
	[InlineData(-3)] // 3 days ago
	[InlineData(-5)] // 5 days ago (edge case)
	public void Validate_ShouldPass_WhenTimestampIsWithinLast5Days(int daysAgo)
	{
		// Arrange
		long timestamp = DateTimeOffset.UtcNow.AddDays(daysAgo).ToUnixTimeSeconds();
		HistoricalWeatherRequest request = new()
		{
			Latitude = 0,
			Longitude = 0,
			Timestamp = timestamp,
			Language = "en",
		};

		// Act
		TestValidationResult<HistoricalWeatherRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Timestamp);
	}
}