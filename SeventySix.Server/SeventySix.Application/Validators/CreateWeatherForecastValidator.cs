// <copyright file="CreateWeatherForecastValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Application.DTOs.Requests;

namespace SeventySix.Application.Validators;

/// <summary>
/// FluentValidation validator for CreateWeatherForecastRequest.
/// Defines validation rules for creating new weather forecasts.
/// </summary>
/// <remarks>
/// This validator implements the Strategy pattern for validation logic,
/// separating validation concerns from business logic.
///
/// Validation Rules:
/// - Date: Required, must be today or in the future
/// - TemperatureC: Must be between -100°C and 100°C (realistic Earth temperatures)
/// - Summary: Optional, but if provided must not exceed 200 characters
///
/// The validator is automatically discovered and registered by FluentValidation
/// during service registration.
///
/// Integration: Works with GlobalExceptionMiddleware to return standardized
/// ValidationProblemDetails responses (HTTP 400) when validation fails.
/// </remarks>
public class CreateWeatherForecastValidator : AbstractValidator<CreateWeatherForecastRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="CreateWeatherForecastValidator"/> class.
	/// Configures all validation rules for the CreateWeatherForecastRequest.
	/// </summary>
	/// <remarks>
	/// Rules are defined in the constructor following FluentValidation conventions.
	/// Each rule includes descriptive error messages for clear client feedback.
	/// </remarks>
	public CreateWeatherForecastValidator()
	{
		// Date validation: Required and must not be in the past
		RuleFor(x => x.Date)
			.NotEmpty()
			.WithMessage("Date is required")
			.Must(date => date >= DateOnly.FromDateTime(DateTime.Today))
			.WithMessage("Date must be today or in the future");

		// Temperature validation: Realistic range for Earth weather
		RuleFor(x => x.TemperatureC)
			.InclusiveBetween(-100, 100)
			.WithMessage("Temperature must be between -100°C and 100°C");

		// Summary validation: Optional field with length constraint
		RuleFor(x => x.Summary)
			.MaximumLength(200)
			.When(x => !string.IsNullOrWhiteSpace(x.Summary))
			.WithMessage("Summary must not exceed 200 characters");
	}
}