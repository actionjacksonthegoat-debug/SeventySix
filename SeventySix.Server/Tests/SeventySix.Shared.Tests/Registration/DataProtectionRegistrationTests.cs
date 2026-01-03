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

public class DataProtectionRegistrationTests
{
	[Fact]
	public void AddConfiguredDataProtection_WithMissingCertificate_ValidationFailsOnStart()
	{
		Dictionary<string, string?> inMemory =
			new()
			{
				["DataProtection:UseCertificatePath"] = "true",
				["DataProtection:CertificatePath"] = "C:\\nonexistent\\cert.pfx",
				["DataProtection:CertificatePassword"] = "pwd",
			};

		IConfiguration configuration =
			new ConfigurationBuilder()
				.AddInMemoryCollection(inMemory)
				.Build();

		ServiceCollection services =
			new();

		IWebHostEnvironment environment =
			Substitute.For<IWebHostEnvironment>();

		environment.EnvironmentName =
			Environments.Production;

		services.AddConfiguredDataProtection(configuration, environment);

		ServiceProvider provider =
			services.BuildServiceProvider();

		// Accessing configured options should trigger validation on start
		OptionsValidationException exception =
			Should.Throw<OptionsValidationException>(() =>
			{
				// Force options resolution
				IOptions<AppDataProtectionOptions> options =
					provider.GetRequiredService<IOptions<AppDataProtectionOptions>>();

				_ = options.Value;
			});

		exception.Message.ShouldContain("Invalid DataProtection configuration");
	}
}
