// <copyright file="AppDataProtectionOptionsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Api.Configuration;

namespace SeventySix.Api.Tests.Configuration;

/// <summary>
/// Unit tests for AppDataProtectionOptionsValidator.
/// </summary>
public sealed class AppDataProtectionOptionsValidatorUnitTests
{
	private readonly AppDataProtectionOptionsValidator Validator = new();

	[Fact]
	public void Validate_ValidWithoutCertificate_PassesValidation()
	{
		// Arrange
		AppDataProtectionOptions options =
			CreateValidOptions();

		// Act
		TestValidationResult<AppDataProtectionOptions> result =
			Validator.TestValidate(options);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_ValidWithCertificate_PassesValidation()
	{
		// Arrange
		AppDataProtectionOptions options =
			CreateValidOptions() with
			{
				UseCertificate = true,
				CertificatePath = "/app/certs/dataprotection.pfx",
			};

		// Act
		TestValidationResult<AppDataProtectionOptions> result =
			Validator.TestValidate(options);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_CertificateEnabledWithEmptyPath_FailsValidation()
	{
		// Arrange
		AppDataProtectionOptions options =
			CreateValidOptions() with
			{
				UseCertificate = true,
				CertificatePath = string.Empty,
			};

		// Act
		TestValidationResult<AppDataProtectionOptions> result =
			Validator.TestValidate(options);

		// Assert
		result.ShouldHaveValidationErrorFor(
			dataProtection => dataProtection.CertificatePath);
	}

	private static AppDataProtectionOptions CreateValidOptions() =>
		new()
		{
			UseCertificate = false,
			KeysDirectory = "keys",
		};
}