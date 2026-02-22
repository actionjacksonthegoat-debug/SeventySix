// <copyright file="NamedCacheSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Shared.Settings;

namespace SeventySix.Shared.Tests.Validators;

/// <summary>
/// Unit tests for NamedCacheSettingsValidator.
/// </summary>
public sealed class NamedCacheSettingsValidatorUnitTests
{
	private readonly NamedCacheSettingsValidator Validator = new();

	[Fact]
	public void Validate_ValidSettings_PassesValidation()
	{
		// Arrange
		NamedCacheSettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<NamedCacheSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_ZeroDuration_FailsValidation()
	{
		// Arrange
		NamedCacheSettings settings =
			CreateValidSettings() with { Duration = TimeSpan.Zero };

		// Act
		TestValidationResult<NamedCacheSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			namedCache => namedCache.Duration);
	}

	[Fact]
	public void Validate_EmptyKeyPrefix_FailsValidation()
	{
		// Arrange
		NamedCacheSettings settings =
			CreateValidSettings() with { KeyPrefix = string.Empty };

		// Act
		TestValidationResult<NamedCacheSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			namedCache => namedCache.KeyPrefix);
	}

	private static NamedCacheSettings CreateValidSettings() =>
		new()
		{
			Duration = TimeSpan.FromMinutes(5),
			FailSafeMaxDuration = TimeSpan.FromHours(1),
			FailSafeThrottleDuration = TimeSpan.FromSeconds(30),
			KeyPrefix = "test:",
		};
}