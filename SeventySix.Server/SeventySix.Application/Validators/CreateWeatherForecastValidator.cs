// <copyright file="CreateWeatherForecastValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Application.DTOs.Requests;

namespace SeventySix.Application.Validators;

/// <summary>
/// Validator for CreateWeatherForecastRequest.
/// </summary>
public class CreateWeatherForecastValidator : AbstractValidator<CreateWeatherForecastRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="CreateWeatherForecastValidator"/> class.
	/// </summary>
	public CreateWeatherForecastValidator()
	{
		RuleFor(x => x.Date)
			.NotEmpty()
			.WithMessage("Date is required")
			.Must(date => date >= DateOnly.FromDateTime(DateTime.Today))
			.WithMessage("Date must be today or in the future");

		RuleFor(x => x.TemperatureC)
			.InclusiveBetween(-100, 100)
			.WithMessage("Temperature must be between -100°C and 100°C");

		RuleFor(x => x.Summary)
			.MaximumLength(200)
			.When(x => !string.IsNullOrWhiteSpace(x.Summary))
			.WithMessage("Summary must not exceed 200 characters");
	}
}
