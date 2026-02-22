using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.Api.Configuration;
using SeventySix.Api.Registration;
using Shouldly;

namespace SeventySix.Shared.Tests.Registration;

/// <summary>
/// Tests for <see cref="DataProtectionExtensions"/> configuration and validation.
/// </summary>
/// <remarks>
/// Following 80/20 rule: Tests focus on critical validation paths only.
/// Certificate file existence and loading are integration concerns.
/// </remarks>
public sealed class DataProtectionRegistrationTests
{
	private static readonly string NonExistentCertPath =
		Path.Combine(
			Path.GetTempPath(),
			"nonexistent",
			"cert.pfx");

	[Fact]
	public void AddConfiguredDataProtection_WithMissingCertificate_InProduction_ThrowsInvalidOperationException()
	{
		// Arrange
		string tempKeysDirectory =
			Path.Combine(
				Path.GetTempPath(),
				$"dp-test-{Guid.NewGuid():N}");

		Dictionary<string, string?> configurationValues =
			new()
			{
				["DataProtection:UseCertificate"] = "true",
				["DataProtection:CertificatePath"] = NonExistentCertPath,
				["DataProtection:KeysDirectory"] = tempKeysDirectory
			};

		IConfiguration configuration =
			new ConfigurationBuilder()
				.AddInMemoryCollection(configurationValues)
				.Build();

		ServiceCollection services =
			new();

		IWebHostEnvironment environment =
			Substitute.For<IWebHostEnvironment>();

		environment.EnvironmentName =
			Environments.Production;

		// Act & Assert - Fail-fast: throws immediately when certificate is required but missing
		InvalidOperationException exception =
			Should.Throw<InvalidOperationException>(
				() => services.AddConfiguredDataProtection(
					configuration,
					environment));

		exception.Message.ShouldContain(
			"Data Protection certificate is required in production");
	}

	[Fact]
	public void AddConfiguredDataProtection_WithMissingCertificate_InDevelopment_AllowsFallbackAsync()
	{
		// Arrange
		Dictionary<string, string?> configurationValues =
			new()
			{
				["DataProtection:UseCertificate"] = "true",
				["DataProtection:CertificatePath"] = NonExistentCertPath,
				["DataProtection:CertificatePassword"] = "test-password",
			};

		IConfiguration configuration =
			new ConfigurationBuilder()
				.AddInMemoryCollection(configurationValues)
				.Build();

		ServiceCollection services =
			new();

		IWebHostEnvironment environment =
			Substitute.For<IWebHostEnvironment>();

		environment.EnvironmentName =
			Environments.Development;

		// Act
		services.AddConfiguredDataProtection(
			configuration,
			environment);

		ServiceProvider provider =
			services.BuildServiceProvider();

		// Assert - Should not throw; falls back to unprotected keys
		IOptions<DataProtectionSettings> dataProtectionOptionsAccessor =
			provider.GetRequiredService<IOptions<DataProtectionSettings>>();

		DataProtectionSettings dataProtectionOptions =
			dataProtectionOptionsAccessor.Value;

		dataProtectionOptions.UseCertificate.ShouldBeTrue();
	}

	[Fact]
	public void AddConfiguredDataProtection_WithNoCertificateConfigured_ValidationPassesAsync()
	{
		// Arrange
		string tempKeysDirectory =
			Path.Combine(
				Path.GetTempPath(),
				$"dp-test-{Guid.NewGuid():N}");

		Dictionary<string, string?> configurationValues =
			new()
			{
				["DataProtection:UseCertificate"] = "false",
				["DataProtection:KeysDirectory"] = tempKeysDirectory,
			};

		IConfiguration configuration =
			new ConfigurationBuilder()
				.AddInMemoryCollection(configurationValues)
				.Build();

		ServiceCollection services =
			new();

		IWebHostEnvironment environment =
			Substitute.For<IWebHostEnvironment>();

		environment.EnvironmentName =
			Environments.Production;

		// Act
		services.AddConfiguredDataProtection(
			configuration,
			environment);

		ServiceProvider provider =
			services.BuildServiceProvider();

		// Assert - Should not throw even in production
		IOptions<DataProtectionSettings> dataProtectionOptionsAccessor =
			provider.GetRequiredService<IOptions<DataProtectionSettings>>();

		dataProtectionOptionsAccessor.Value.UseCertificate.ShouldBeFalse();
	}
}