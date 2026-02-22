// <copyright file="DataProtectionSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Api.Configuration;

namespace SeventySix.Api.Tests.Configuration;

/// <summary>
/// Unit tests for DataProtectionSettingsValidator.
/// </summary>
public sealed class DataProtectionSettingsValidatorUnitTests
{
	private readonly DataProtectionSettingsValidator Validator = new();

	[Fact]
	public void Validate_ValidWithoutCertificate_PassesValidation()
	{
		// Arrange
		DataProtectionSettings options =
			CreateValidOptions();

		// Act
		TestValidationResult<DataProtectionSettings> result =
			Validator.TestValidate(options);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_ValidWithCertificate_PassesValidation()
	{
		// Arrange
		DataProtectionSettings options =
			CreateValidOptions() with
			{
				UseCertificate = true,
				CertificatePath = "/app/certs/dataprotection.pfx",
				CertificatePassword = "s3cr3t",
			};

		// Act
		TestValidationResult<DataProtectionSettings> result =
			Validator.TestValidate(options);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_CertificateEnabledWithEmptyPassword_FailsValidation()
	{
		// Arrange
		DataProtectionSettings options =
			CreateValidOptions() with
			{
				UseCertificate = true,
				CertificatePath = "/app/certs/dataprotection.pfx",
				CertificatePassword = string.Empty,
			};

		// Act
		TestValidationResult<DataProtectionSettings> result =
			Validator.TestValidate(options);

		// Assert
		result.ShouldHaveValidationErrorFor(
			dataProtection => dataProtection.CertificatePassword);
	}

	[Fact]
	public void Validate_CertificateEnabledWithEmptyPath_FailsValidation()
	{
		// Arrange
		DataProtectionSettings options =
			CreateValidOptions() with
			{
				UseCertificate = true,
				CertificatePath = string.Empty,
			};

		// Act
		TestValidationResult<DataProtectionSettings> result =
			Validator.TestValidate(options);

		// Assert
		result.ShouldHaveValidationErrorFor(
			dataProtection => dataProtection.CertificatePath);
	}

	private static DataProtectionSettings CreateValidOptions() =>
		new()
		{
			UseCertificate = false,
			KeysDirectory = "keys",
		};
}