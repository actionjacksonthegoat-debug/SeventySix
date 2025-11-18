// <copyright file="WeatherRequestValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.BusinessLogic.DTOs.Requests;

namespace SeventySix.BusinessLogic.Validators;

/// <summary>
/// Validator for WeatherRequest.
/// </summary>
public class WeatherRequestValidator : AbstractValidator<WeatherRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="WeatherRequestValidator"/> class.
	/// </summary>
	public WeatherRequestValidator()
	{
		RuleFor(x => x.Latitude)
			.InclusiveBetween(-90, 90)
			.WithMessage("Latitude must be between -90 and 90 degrees.");

		RuleFor(x => x.Longitude)
			.InclusiveBetween(-180, 180)
			.WithMessage("Longitude must be between -180 and 180 degrees.");

		RuleFor(x => x.Language)
			.NotEmpty()
			.Length(2)
			.WithMessage("Language must be a 2-character ISO code (e.g., 'en', 'es').");

		RuleFor(x => x.Exclude)
			.Must(BeValidExcludeList!)
			.When(x => !string.IsNullOrWhiteSpace(x.Exclude))
			.WithMessage("Exclude must contain valid values: current, minutely, hourly, daily, alerts.");
	}

	/// <summary>
	/// Validates the exclude list contains only valid values.
	/// </summary>
	private static bool BeValidExcludeList(string exclude)
	{
		if (string.IsNullOrWhiteSpace(exclude))
		{
			return true;
		}

		string[] validValues = ["current", "minutely", "hourly", "daily", "alerts"];
		string[] excludeValues = exclude.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

		return excludeValues.All(v => validValues.Contains(v.ToLowerInvariant()));
	}
}