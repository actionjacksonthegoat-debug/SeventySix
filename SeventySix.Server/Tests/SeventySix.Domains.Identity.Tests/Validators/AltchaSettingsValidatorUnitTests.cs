// <copyright file="AltchaSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity;

namespace SeventySix.Domains.Identity.Tests.Validators;

/// <summary>
/// Unit tests for AltchaSettingsValidator.
/// </summary>
public sealed class AltchaSettingsValidatorUnitTests
{
	private readonly AltchaSettingsValidator Validator = new();

	[Fact]
	public void Validate_ValidEnabledSettings_PassesValidation()
	{
		// Arrange
		AltchaSettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<AltchaSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_DisabledWithEmptyKey_PassesValidation()
	{
		// Arrange
		AltchaSettings settings =
			CreateValidSettings() with { Enabled = false, HmacKeyBase64 = string.Empty };

		// Act
		TestValidationResult<AltchaSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_EnabledWithEmptyHmacKey_FailsValidation()
	{
		// Arrange
		AltchaSettings settings =
			CreateValidSettings() with { HmacKeyBase64 = string.Empty };

		// Act
		TestValidationResult<AltchaSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			altcha => altcha.HmacKeyBase64);
	}

	[Fact]
	public void Validate_ComplexityMaxLessThanMin_FailsValidation()
	{
		// Arrange
		AltchaSettings settings =
			CreateValidSettings() with { ComplexityMin = 10, ComplexityMax = 5 };

		// Act
		TestValidationResult<AltchaSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			altcha => altcha.ComplexityMax);
	}

	[Fact]
	public void Validate_ZeroExpirySeconds_FailsValidation()
	{
		// Arrange
		AltchaSettings settings =
			CreateValidSettings() with { ExpirySeconds = 0 };

		// Act
		TestValidationResult<AltchaSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			altcha => altcha.ExpirySeconds);
	}

	[Fact]
	public void Validate_EnabledWithKeyTooShort_FailsValidation()
	{
		// Arrange — 32-byte key (Ixnas.AltchaNet requires exactly 64)
		AltchaSettings settings =
			CreateValidSettings() with
			{
				HmacKeyBase64 = "QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpBQkNERUY="
			};

		// Act
		TestValidationResult<AltchaSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			altcha => altcha.HmacKeyBase64);
	}

	[Fact]
	public void Validate_EnabledWithInvalidBase64_FailsValidation()
	{
		// Arrange
		AltchaSettings settings =
			CreateValidSettings() with { HmacKeyBase64 = "not-valid-base64!!!" };

		// Act
		TestValidationResult<AltchaSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			altcha => altcha.HmacKeyBase64);
	}

	[Fact]
	public void Validate_EnabledWithExactly64ByteKey_PassesValidation()
	{
		// Arrange — exactly 64 bytes
		AltchaSettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<AltchaSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveValidationErrorFor(
			altcha => altcha.HmacKeyBase64);
	}

	[Fact]
	public void Validate_DisabledWithShortKey_PassesValidation()
	{
		// Arrange — disabled skips key length validation
		AltchaSettings settings =
			CreateValidSettings() with
			{
				Enabled = false,
				HmacKeyBase64 = "c2hvcnQ="
			};

		// Act
		TestValidationResult<AltchaSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	/// <summary>
	/// Creates valid settings with a proper 64-byte HMAC key.
	/// </summary>
	private static AltchaSettings CreateValidSettings() =>
		new()
		{
			Enabled = true,
			HmacKeyBase64 =
				"QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWkFCQ0RFRkdISUpLTA==",
			ComplexityMin = 1,
			ComplexityMax = 10,
			ExpirySeconds = 300,
		};
}