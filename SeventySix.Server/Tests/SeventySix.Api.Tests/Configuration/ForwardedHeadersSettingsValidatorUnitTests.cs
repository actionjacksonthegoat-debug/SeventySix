// <copyright file="ForwardedHeadersSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Api.Configuration;

namespace SeventySix.Api.Tests.Configuration;

/// <summary>
/// Unit tests for ForwardedHeadersSettingsValidator.
/// </summary>
public sealed class ForwardedHeadersSettingsValidatorUnitTests
{
	private readonly ForwardedHeadersSettingsValidator Validator = new();

	[Fact]
	public void Validate_ValidSettings_PassesValidation()
	{
		// Arrange
		ForwardedHeadersSettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<ForwardedHeadersSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_ZeroForwardLimit_FailsValidation()
	{
		// Arrange
		ForwardedHeadersSettings settings =
			CreateValidSettings() with { ForwardLimit = 0 };

		// Act
		TestValidationResult<ForwardedHeadersSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			headers => headers.ForwardLimit);
	}

	[Fact]
	public void Validate_ForwardLimitAboveMaximum_FailsValidation()
	{
		// Arrange
		ForwardedHeadersSettings settings =
			CreateValidSettings() with { ForwardLimit = 11 };

		// Act
		TestValidationResult<ForwardedHeadersSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			headers => headers.ForwardLimit);
	}

	private static ForwardedHeadersSettings CreateValidSettings() =>
		new()
		{
			ForwardLimit = 2,
			KnownProxies = [],
			KnownNetworks = [],
		};
}