// <copyright file="RequestLimitsSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Api.Configuration;

/// <summary>
/// FluentValidation validator for RequestLimitsSettings.
/// Ensures request limits configuration is valid at startup.
/// </summary>
/// <remarks>
/// Validates:
/// - MaxRequestBodySizeBytes is greater than 0
/// - MaxFormOptionsBufferLength is greater than 0
/// - MaxMultipartBodyLengthBytes is greater than 0
///
/// This validator is used at application startup to fail fast
/// if request limits configuration is invalid or missing.
/// </remarks>
public sealed class RequestLimitsSettingsValidator : AbstractValidator<RequestLimitsSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="RequestLimitsSettingsValidator"/> class.
	/// </summary>
	public RequestLimitsSettingsValidator()
	{
		RuleFor(settings => settings.MaxRequestBodySizeBytes)
			.GreaterThan(0)
			.WithMessage("RequestLimits:MaxRequestBodySizeBytes must be greater than 0");

		RuleFor(settings => settings.MaxFormOptionsBufferLength)
			.GreaterThan(0)
			.WithMessage("RequestLimits:MaxFormOptionsBufferLength must be greater than 0");

		RuleFor(settings => settings.MaxMultipartBodyLengthBytes)
			.GreaterThan(0)
			.WithMessage("RequestLimits:MaxMultipartBodyLengthBytes must be greater than 0");
	}
}