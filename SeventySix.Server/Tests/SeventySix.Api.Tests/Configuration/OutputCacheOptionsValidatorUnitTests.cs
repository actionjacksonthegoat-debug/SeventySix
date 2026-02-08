// <copyright file="OutputCacheOptionsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Api.Configuration;
using Shouldly;

namespace SeventySix.Api.Tests.Configuration;

/// <summary>
/// Unit tests for OutputCacheOptionsValidator.
/// </summary>
public sealed class OutputCacheOptionsValidatorUnitTests
{
	private readonly OutputCacheOptionsValidator Validator = new();

	[Fact]
	public void Validate_ValidSettings_PassesValidation()
	{
		// Arrange
		OutputCacheOptions options =
			CreateValidOptions();

		// Act
		TestValidationResult<OutputCacheOptions> result =
			Validator.TestValidate(options);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_EmptyPolicies_PassesValidation()
	{
		// Arrange
		OutputCacheOptions options =
			new() { Policies = [] };

		// Act
		TestValidationResult<OutputCacheOptions> result =
			Validator.TestValidate(options);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_PolicyWithZeroDuration_FailsValidation()
	{
		// Arrange
		OutputCacheOptions options =
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
		TestValidationResult<OutputCacheOptions> result =
			Validator.TestValidate(options);

		// Assert
		result.IsValid.ShouldBeFalse();
	}

	private static OutputCacheOptions CreateValidOptions() =>
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
