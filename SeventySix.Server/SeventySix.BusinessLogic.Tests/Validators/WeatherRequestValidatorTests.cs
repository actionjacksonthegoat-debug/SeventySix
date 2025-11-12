// <copyright file="WeatherRequestValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.BusinessLogic.Validators;
using SeventySix.Core.DTOs.OpenWeather.Common;
using SeventySix.Core.DTOs.Requests;

namespace SeventySix.BusinessLogic.Tests.Validators;

/// <summary>
/// Unit tests for <see cref="WeatherRequestValidator"/>.
/// </summary>
public class WeatherRequestValidatorTests
{
	private readonly WeatherRequestValidator Validator;

	/// <summary>
	/// Initializes a new instance of the <see cref="WeatherRequestValidatorTests"/> class.
	/// </summary>
	public WeatherRequestValidatorTests()
	{
		Validator = new WeatherRequestValidator();
	}

	[Fact]
	public void Validate_ShouldPass_WhenRequestIsValid()
	{
		// Arrange
		var request = new WeatherRequest
		{
			Latitude = 40.7128,
			Longitude = -74.0060,
			Units = Units.Metric,
			Language = "en",
		};

		// Act
		var result = Validator.TestValidate(request);

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
		var request = new WeatherRequest
		{
			Latitude = latitude,
			Longitude = 0,
			Language = "en",
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Latitude)
			.WithErrorMessage("Latitude must be between -90 and 90 degrees.");
	}

	[Theory]
	[InlineData(-90)]
	[InlineData(0)]
	[InlineData(90)]
	public void Validate_ShouldPass_WhenLatitudeIsValid(double latitude)
	{
		// Arrange
		var request = new WeatherRequest
		{
			Latitude = latitude,
			Longitude = 0,
			Language = "en",
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Latitude);
	}

	[Theory]
	[InlineData(-181)]
	[InlineData(181)]
	[InlineData(-200)]
	[InlineData(200)]
	public void Validate_ShouldFail_WhenLongitudeIsOutOfRange(double longitude)
	{
		// Arrange
		var request = new WeatherRequest
		{
			Latitude = 0,
			Longitude = longitude,
			Language = "en",
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Longitude)
			.WithErrorMessage("Longitude must be between -180 and 180 degrees.");
	}

	[Theory]
	[InlineData(-180)]
	[InlineData(0)]
	[InlineData(180)]
	public void Validate_ShouldPass_WhenLongitudeIsValid(double longitude)
	{
		// Arrange
		var request = new WeatherRequest
		{
			Latitude = 0,
			Longitude = longitude,
			Language = "en",
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Longitude);
	}

	[Theory]
	[InlineData("")]
	[InlineData("e")]
	[InlineData("eng")]
	public void Validate_ShouldFail_WhenLanguageIsInvalid(string language)
	{
		// Arrange
		var request = new WeatherRequest
		{
			Latitude = 0,
			Longitude = 0,
			Language = language,
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Language)
			.WithErrorMessage("Language must be a 2-character ISO code (e.g., 'en', 'es').");
	}

	[Theory]
	[InlineData("en")]
	[InlineData("es")]
	[InlineData("fr")]
	public void Validate_ShouldPass_WhenLanguageIsValid(string language)
	{
		// Arrange
		var request = new WeatherRequest
		{
			Latitude = 0,
			Longitude = 0,
			Language = language,
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Language);
	}

	[Theory]
	[InlineData("current")]
	[InlineData("minutely")]
	[InlineData("hourly")]
	[InlineData("daily")]
	[InlineData("alerts")]
	[InlineData("current,minutely")]
	[InlineData("hourly,daily,alerts")]
	public void Validate_ShouldPass_WhenExcludeListIsValid(string exclude)
	{
		// Arrange
		var request = new WeatherRequest
		{
			Latitude = 0,
			Longitude = 0,
			Language = "en",
			Exclude = exclude,
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Exclude);
	}

	[Theory]
	[InlineData("invalid")]
	[InlineData("current,invalid")]
	[InlineData("weekly")]
	public void Validate_ShouldFail_WhenExcludeListIsInvalid(string exclude)
	{
		// Arrange
		var request = new WeatherRequest
		{
			Latitude = 0,
			Longitude = 0,
			Language = "en",
			Exclude = exclude,
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Exclude)
			.WithErrorMessage("Exclude must contain valid values: current, minutely, hourly, daily, alerts.");
	}

	[Fact]
	public void Validate_ShouldPass_WhenExcludeIsNull()
	{
		// Arrange
		var request = new WeatherRequest
		{
			Latitude = 0,
			Longitude = 0,
			Language = "en",
			Exclude = null,
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Exclude);
	}

	[Fact]
	public void Validate_ShouldPass_WhenExcludeIsEmpty()
	{
		// Arrange
		var request = new WeatherRequest
		{
			Latitude = 0,
			Longitude = 0,
			Language = "en",
			Exclude = string.Empty,
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Exclude);
	}
}