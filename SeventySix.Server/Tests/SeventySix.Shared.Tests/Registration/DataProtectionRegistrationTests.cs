using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.Api.Configuration;
using SeventySix.Api.Registration;
using Shouldly;
using Xunit;

namespace SeventySix.Shared.Tests.Registration;

/// <summary>
/// Tests for <see cref="DataProtectionExtensions"/> configuration and validation.
/// </summary>
/// <remarks>
/// Following 80/20 rule: Tests focus on critical validation paths only.
/// Certificate file existence and loading are integration concerns.
/// </remarks>
public class DataProtectionRegistrationTests
{
	[Fact]
	public void AddConfiguredDataProtection_WithMissingCertificate_InProduction_ValidationFailsAsync()
	{
		// Arrange
		Dictionary<string, string?> configurationValues =
			new()
			{
				["DataProtection:UseCertificate"] = "true",
				["DataProtection:CertificatePath"] = "C:\\nonexistent\\cert.pfx",
				["DataProtection:AllowUnprotectedKeysInDevelopment"] = "false",
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

		// Assert
		OptionsValidationException validationException =
			Should.Throw<OptionsValidationException>(() =>
			{
				IOptions<AppDataProtectionOptions> dataProtectionOptions =
					provider.GetRequiredService<IOptions<AppDataProtectionOptions>>();

				_ = dataProtectionOptions.Value;
			});

		validationException.Message.ShouldContain("Invalid DataProtection configuration");
	}

	[Fact]
	public void AddConfiguredDataProtection_WithMissingCertificate_InDevelopment_AllowsFallbackAsync()
	{
		// Arrange
		Dictionary<string, string?> configurationValues =
			new()
			{
				["DataProtection:UseCertificate"] = "true",
				["DataProtection:CertificatePath"] = "C:\\nonexistent\\cert.pfx",
				["DataProtection:AllowUnprotectedKeysInDevelopment"] = "true",
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

		// Assert - Should not throw
		IOptions<AppDataProtectionOptions> dataProtectionOptionsAccessor =
			provider.GetRequiredService<IOptions<AppDataProtectionOptions>>();

		AppDataProtectionOptions dataProtectionOptions =
			dataProtectionOptionsAccessor.Value;

		dataProtectionOptions.UseCertificate.ShouldBeTrue();
		dataProtectionOptions.AllowUnprotectedKeysInDevelopment.ShouldBeTrue();
	}

	[Fact]
	public void AddConfiguredDataProtection_WithNoCertificateConfigured_ValidationPassesAsync()
	{
		// Arrange
		Dictionary<string, string?> configurationValues =
			new()
			{
				["DataProtection:UseCertificate"] = "false",
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
		IOptions<AppDataProtectionOptions> dataProtectionOptionsAccessor =
			provider.GetRequiredService<IOptions<AppDataProtectionOptions>>();

		dataProtectionOptionsAccessor.Value.UseCertificate.ShouldBeFalse();
	}

	[Fact]
	public void AddConfiguredDataProtection_WithMissingCertificate_InDevelopment_FallbackDisabled_ValidationFailsAsync()
	{
		// Arrange
		Dictionary<string, string?> configurationValues =
			new()
			{
				["DataProtection:UseCertificate"] = "true",
				["DataProtection:CertificatePath"] = "C:\\nonexistent\\cert.pfx",
				["DataProtection:AllowUnprotectedKeysInDevelopment"] = "false",
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

		// Assert - Should throw even in development when fallback is disabled
		Should.Throw<OptionsValidationException>(() =>
		{
			IOptions<AppDataProtectionOptions> dataProtectionOptions =
				provider.GetRequiredService<IOptions<AppDataProtectionOptions>>();

			_ =
				dataProtectionOptions.Value;
		});
	}
}
