// <copyright file="EnvironmentVariableMappingTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Configuration;
using SeventySix.Api.Configuration;
using Shouldly;

namespace SeventySix.Api.Tests.Configuration;

/// <summary>
/// Tests for <see cref="EnvironmentVariableMappingExtensions"/>.
/// </summary>
/// <remarks>
/// Validates that flat .env-style environment variables are correctly mapped
/// to ASP.NET Core's hierarchical configuration format.
/// </remarks>
public sealed class EnvironmentVariableMappingTests : IDisposable
{
	/// <summary>
	/// Environment variables set during each test that need cleanup.
	/// </summary>
	private readonly List<string> EnvironmentVariablesToCleanup = [];

	/// <summary>
	/// Cleans up environment variables after each test.
	/// </summary>
	public void Dispose()
	{
		foreach (string variableName in EnvironmentVariablesToCleanup)
		{
			Environment.SetEnvironmentVariable(variableName, null);
		}
	}

	[Fact]
	public void AddEnvironmentVariableMapping_WithJwtSecretKey_MapsToHierarchicalConfiguration()
	{
		// Arrange
		string secretKey =
			"test-secret-key-minimum-32-characters-long-for-testing";
		SetEnvironmentVariable("JWT_SECRET_KEY", secretKey);

		ConfigurationManager configuration = new();

		// Act
		configuration.AddEnvironmentVariableMapping();

		// Assert
		configuration["Jwt:SecretKey"].ShouldBe(secretKey);
	}

	[Fact]
	public void AddEnvironmentVariableMapping_WithDatabaseVariables_MapsAllComponents()
	{
		// Arrange
		SetEnvironmentVariable("DB_NAME", "testdb");
		SetEnvironmentVariable("DB_USER", "testuser");
		SetEnvironmentVariable("DB_PASSWORD", "testpass");

		ConfigurationManager configuration = new();

		// Act
		configuration.AddEnvironmentVariableMapping();

		// Assert
		configuration["Database:Name"].ShouldBe("testdb");
		configuration["Database:User"].ShouldBe("testuser");
		configuration["Database:Password"].ShouldBe("testpass");
	}

	[Fact]
	public void AddEnvironmentVariableMapping_WithGitHubOAuth_MapsToProviderArray()
	{
		// Arrange
		SetEnvironmentVariable("GITHUB_CLIENT_ID", "test-client-id");
		SetEnvironmentVariable(
			"GITHUB_CLIENT_SECRET",
			"test-client-secret");

		ConfigurationManager configuration = new();

		// Act
		configuration.AddEnvironmentVariableMapping();

		// Assert
		configuration["Auth:OAuth:Providers:0:ClientId"]
			.ShouldBe("test-client-id");
		configuration["Auth:OAuth:Providers:0:ClientSecret"]
			.ShouldBe("test-client-secret");
	}

	[Fact]
	public void AddEnvironmentVariableMapping_WithEmailVariables_MapsCorrectly()
	{
		// Arrange
		SetEnvironmentVariable("EMAIL_SMTP_USERNAME", "smtp-user");
		SetEnvironmentVariable("EMAIL_SMTP_PASSWORD", "smtp-pass");
		SetEnvironmentVariable("EMAIL_FROM_ADDRESS", "test@example.com");

		ConfigurationManager configuration = new();

		// Act
		configuration.AddEnvironmentVariableMapping();

		// Assert
		configuration["Email:SmtpUsername"].ShouldBe("smtp-user");
		configuration["Email:SmtpPassword"].ShouldBe("smtp-pass");
		configuration["Email:FromAddress"].ShouldBe("test@example.com");
	}

	[Fact]
	public void AddEnvironmentVariableMapping_WithNoEnvironmentVariables_DoesNotThrow()
	{
		// Arrange
		ConfigurationManager configuration = new();

		// Act & Assert - Should not throw
		Should.NotThrow(() => configuration.AddEnvironmentVariableMapping());
	}

	[Fact]
	public void AddEnvironmentVariableMapping_ReturnsConfigurationForChaining()
	{
		// Arrange
		ConfigurationManager configuration = new();

		// Act
		ConfigurationManager result =
			configuration.AddEnvironmentVariableMapping();

		// Assert
		result.ShouldBeSameAs(configuration);
	}

	[Fact]
	public void AddEnvironmentVariableMapping_WithDataProtectionVariables_MapsCorrectly()
	{
		// Arrange
		SetEnvironmentVariable(
			"DATA_PROTECTION_USE_CERTIFICATE",
			"true");
		SetEnvironmentVariable(
			"DATA_PROTECTION_CERTIFICATE_PATH",
			"/app/keys/cert.pfx");
		SetEnvironmentVariable(
			"DATA_PROTECTION_CERTIFICATE_PASSWORD",
			"secret123");
		SetEnvironmentVariable(
			"DATA_PROTECTION_KEYS_DIRECTORY",
			"/custom/keys");
		SetEnvironmentVariable(
			"DATA_PROTECTION_ALLOW_UNPROTECTED_DEV",
			"false");

		ConfigurationManager configuration = new();

		// Act
		configuration.AddEnvironmentVariableMapping();

		// Assert
		configuration["DataProtection:UseCertificate"].ShouldBe("true");
		configuration["DataProtection:CertificatePath"]
			.ShouldBe("/app/keys/cert.pfx");
		configuration["DataProtection:CertificatePassword"]
			.ShouldBe("secret123");
		configuration["DataProtection:KeysDirectory"].ShouldBe("/custom/keys");
		configuration["DataProtection:AllowUnprotectedKeysInDevelopment"]
			.ShouldBe("false");
	}

	[Fact]
	public void AddEnvironmentVariableMapping_WithRecaptchaVariables_MapsCorrectly()
	{
		// Arrange
		SetEnvironmentVariable(
			"RECAPTCHA_SITE_KEY",
			"test-site-key");
		SetEnvironmentVariable(
			"RECAPTCHA_SECRET_KEY",
			"test-secret-key");

		ConfigurationManager configuration = new();

		// Act
		configuration.AddEnvironmentVariableMapping();

		// Assert
		configuration["Recaptcha:SiteKey"]
			.ShouldBe("test-site-key");
		configuration["Recaptcha:SecretKey"]
			.ShouldBe("test-secret-key");
	}

	/// <summary>
	/// Sets an environment variable and tracks it for cleanup.
	/// </summary>
	/// <param name="name">
	/// The environment variable name.
	/// </param>
	/// <param name="value">
	/// The environment variable value.
	/// </param>
	private void SetEnvironmentVariable(string name, string value)
	{
		EnvironmentVariablesToCleanup.Add(name);
		Environment.SetEnvironmentVariable(name, value);
	}
}