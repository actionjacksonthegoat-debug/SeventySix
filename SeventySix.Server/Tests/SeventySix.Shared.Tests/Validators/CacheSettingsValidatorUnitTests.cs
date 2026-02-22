// <copyright file="CacheSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Shared.Settings;

namespace SeventySix.Shared.Tests.Validators;

/// <summary>
/// Unit tests for CacheSettingsValidator.
/// </summary>
public sealed class CacheSettingsValidatorUnitTests
{
	private readonly CacheSettingsValidator Validator = new();

	[Fact]
	public void Validate_ValidSettings_PassesValidation()
	{
		// Arrange
		CacheSettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<CacheSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_ZeroDefaultDuration_FailsValidation()
	{
		// Arrange
		CacheSettings settings =
			CreateValidSettings() with { DefaultDuration = TimeSpan.Zero };

		// Act
		TestValidationResult<CacheSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			cache => cache.DefaultDuration);
	}

	[Fact]
	public void Validate_EmptyDefaultKeyPrefix_FailsValidation()
	{
		// Arrange
		CacheSettings settings =
			CreateValidSettings() with { DefaultKeyPrefix = string.Empty };

		// Act
		TestValidationResult<CacheSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			cache => cache.DefaultKeyPrefix);
	}

	[Fact]
	public void Validate_ZeroFailSafeMaxDuration_FailsValidation()
	{
		// Arrange
		CacheSettings settings =
			CreateValidSettings() with { FailSafeMaxDuration = TimeSpan.Zero };

		// Act
		TestValidationResult<CacheSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			cache => cache.FailSafeMaxDuration);
	}

	private static CacheSettings CreateValidSettings() =>
		new()
		{
			DefaultDuration = TimeSpan.FromMinutes(5),
			FailSafeMaxDuration = TimeSpan.FromHours(1),
			FailSafeThrottleDuration = TimeSpan.FromSeconds(30),
			DefaultKeyPrefix = "test:",
			Valkey = new ValkeySettings { Enabled = false },
			Identity = new NamedCacheSettings
			{
				Duration = TimeSpan.FromMinutes(1),
				KeyPrefix = "identity:",
			},
			Logging = new NamedCacheSettings
			{
				Duration = TimeSpan.FromMinutes(5),
				KeyPrefix = "logging:",
			},
			ApiTracking = new NamedCacheSettings
			{
				Duration = TimeSpan.FromMinutes(5),
				KeyPrefix = "apitracking:",
			},
		};
}