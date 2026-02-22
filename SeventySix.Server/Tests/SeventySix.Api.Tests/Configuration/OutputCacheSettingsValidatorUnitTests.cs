// <copyright file="OutputCacheSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Api.Configuration;
using Shouldly;

namespace SeventySix.Api.Tests.Configuration;

/// <summary>
/// Unit tests for OutputCacheSettingsValidator.
/// </summary>
public sealed class OutputCacheOptionsValidatorUnitTests
{
	private readonly OutputCacheSettingsValidator Validator = new();

	[Fact]
	public void Validate_ValidSettings_PassesValidation()
	{
		// Arrange
		OutputCacheSettings options =
			CreateValidOptions();

		// Act
		TestValidationResult<OutputCacheSettings> result =
			Validator.TestValidate(options);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_EmptyPolicies_PassesValidation()
	{
		// Arrange
		OutputCacheSettings options =
			new() { Policies = [] };

		// Act
		TestValidationResult<OutputCacheSettings> result =
			Validator.TestValidate(options);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_PolicyWithZeroDuration_FailsValidation()
	{
		// Arrange
		OutputCacheSettings options =
			new()
			{
				Policies = new Dictionary<string, CachePolicyConfig>
				{
					["test"] = new CachePolicyConfig
					{
						DurationSeconds = 0,
						Tag = "test",
						Enabled = true,
					},
				},
			};

		// Act
		TestValidationResult<OutputCacheSettings> result =
			Validator.TestValidate(options);

		// Assert
		result.IsValid.ShouldBeFalse();
	}

	private static OutputCacheSettings CreateValidOptions() =>
		new()
		{
			Policies = new Dictionary<string, CachePolicyConfig>
			{
				["default"] = new CachePolicyConfig
				{
					DurationSeconds = 60,
					Tag = "default",
					Enabled = true,
				},
			},
		};
}