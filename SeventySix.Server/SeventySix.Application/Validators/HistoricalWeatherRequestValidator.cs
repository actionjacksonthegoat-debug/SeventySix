// <copyright file="HistoricalWeatherRequestValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Application.DTOs.Requests;

namespace SeventySix.Application.Validators;

/// <summary>
/// Validator for HistoricalWeatherRequest.
/// </summary>
public class HistoricalWeatherRequestValidator : AbstractValidator<HistoricalWeatherRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="HistoricalWeatherRequestValidator"/> class.
	/// </summary>
	public HistoricalWeatherRequestValidator()
	{
		RuleFor(x => x.Latitude)
			.InclusiveBetween(-90, 90)
			.WithMessage("Latitude must be between -90 and 90 degrees.");

		RuleFor(x => x.Longitude)
			.InclusiveBetween(-180, 180)
			.WithMessage("Longitude must be between -180 and 180 degrees.");

		RuleFor(x => x.Timestamp)
			.Must(BeWithinLast5Days)
			.WithMessage("Historical data is only available for the last 5 days.");

		RuleFor(x => x.Language)
			.NotEmpty()
			.Length(2)
			.WithMessage("Language must be a 2-character ISO code (e.g., 'en', 'es').");
	}

	/// <summary>
	/// Validates that the timestamp is within the last 5 days.
	/// </summary>
	private static bool BeWithinLast5Days(long timestamp)
	{
		DateTime requestedDate = DateTimeOffset.FromUnixTimeSeconds(timestamp).UtcDateTime;
		DateTime fiveDaysAgo = DateTime.UtcNow.AddDays(-5).AddSeconds(-1); // Add buffer for edge case

		return requestedDate >= fiveDaysAgo && requestedDate <= DateTime.UtcNow;
	}
}