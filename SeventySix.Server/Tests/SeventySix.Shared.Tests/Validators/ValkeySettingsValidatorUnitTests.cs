// <copyright file="ValkeySettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Shared.Settings;

namespace SeventySix.Shared.Tests.Validators;

/// <summary>
/// Unit tests for ValkeySettingsValidator.
/// Validates Valkey/Redis cache configuration requirements.
/// </summary>
/// <remarks>
/// Test Pattern: MethodName_Scenario_ExpectedResult
/// </remarks>
public sealed class ValkeySettingsValidatorUnitTests
{
	private readonly ValkeySettingsValidator Validator = new();

	/// <summary>
	/// Creates a valid ValkeySettings instance with optional overrides.
	/// </summary>
	/// <param name="enabled">
	/// Whether Valkey is enabled.
	/// </param>
	/// <param name="connectionString">
	/// The connection string.
	/// </param>
	/// <param name="instanceName">
	/// The instance name prefix.
	/// </param>
	/// <returns>
	/// A configured ValkeySettings instance.
	/// </returns>
	private static ValkeySettings CreateValidSettings(
		bool enabled = true,
		string connectionString = "localhost:6379",
		string instanceName = "test:") =>
		new()
		{
			Enabled = enabled,
			ConnectionString = connectionString,
			InstanceName = instanceName,
			ConnectTimeoutMs = 5000,
			SyncTimeoutMs = 1000,
			AsyncTimeoutMs = 5000,
			ConnectRetry = 3,
			ConnectionPoolSize = 1,
		};

	[Fact]
	public void Validate_EmptyConnectionString_FailsValidation()
	{
		// Arrange
		ValkeySettings settings =
			CreateValidSettings(
				enabled: true,
				connectionString: string.Empty);

		// Act
		TestValidationResult<ValkeySettings> result =
			Validator.TestValidate(settings);

		// Assert
		result
			.ShouldHaveValidationErrorFor(settings => settings.ConnectionString)
			.WithErrorMessage("Valkey ConnectionString is required when Valkey is enabled");
	}

	[Fact]
	public void Validate_ValidConnectionString_PassesValidation()
	{
		// Arrange
		ValkeySettings settings =
			CreateValidSettings(
				enabled: true,
				connectionString: "localhost:6379");

		// Act
		TestValidationResult<ValkeySettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveValidationErrorFor(settings => settings.ConnectionString);
	}

	[Fact]
	public void Validate_DisabledWithEmptyConnectionString_PassesValidation()
	{
		// Arrange
		ValkeySettings settings =
			CreateValidSettings(
				enabled: false,
				connectionString: string.Empty);

		// Act
		TestValidationResult<ValkeySettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_EmptyInstanceName_FailsValidation()
	{
		// Arrange
		ValkeySettings settings =
			CreateValidSettings(
				enabled: true,
				instanceName: string.Empty);

		// Act
		TestValidationResult<ValkeySettings> result =
			Validator.TestValidate(settings);

		// Assert
		result
			.ShouldHaveValidationErrorFor(settings => settings.InstanceName)
			.WithErrorMessage("Valkey InstanceName is required");
	}

	[Fact]
	public void Validate_TimeoutBelowMinimum_FailsValidation()
	{
		// Arrange
		ValkeySettings settings =
			new()
			{
				Enabled = true,
				ConnectionString = "localhost:6379",
				InstanceName = "test:",
				ConnectTimeoutMs = 50, // Below minimum of 100
			};

		// Act
		TestValidationResult<ValkeySettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(settings => settings.ConnectTimeoutMs);
	}

	[Fact]
	public void Validate_TimeoutAboveMaximum_FailsValidation()
	{
		// Arrange
		ValkeySettings settings =
			new()
			{
				Enabled = true,
				ConnectionString = "localhost:6379",
				InstanceName = "test:",
				ConnectTimeoutMs = 60000, // Above maximum of 30000
			};

		// Act
		TestValidationResult<ValkeySettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(settings => settings.ConnectTimeoutMs);
	}
}