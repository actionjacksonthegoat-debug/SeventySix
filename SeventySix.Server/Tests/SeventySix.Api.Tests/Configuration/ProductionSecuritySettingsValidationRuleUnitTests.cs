// <copyright file="ProductionSecuritySettingsValidationRuleUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NSubstitute;
using SeventySix.Api.Configuration;
using Shouldly;

namespace SeventySix.Api.Tests.Configuration;

/// <summary>
/// Unit tests for <see cref="ProductionSecuritySettingsValidationRule"/>.
/// Focus: production environment security checks for MFA, TOTP, cookie settings.
/// </summary>
public sealed class ProductionSecuritySettingsValidationRuleUnitTests
{
	private readonly ProductionSecuritySettingsValidationRule _rule =
		new();

	private readonly ILogger _logger =
		Substitute.For<ILogger>();

	/// <summary>
	/// Verifies that non-production environments pass without throwing.
	/// </summary>
	[Fact]
	public void Validate_NonProductionEnvironment_DoesNotThrow()
	{
		IConfiguration configuration =
			new ConfigurationBuilder()
				.AddInMemoryCollection(new Dictionary<string, string?>())
				.Build();

		IHostEnvironment environment =
			CreateEnvironment(Environments.Development);

		Should.NotThrow(
			() => _rule.Validate(configuration, environment, _logger));
	}

	/// <summary>
	/// Verifies that production with MFA disabled throws an <see cref="InvalidOperationException"/>.
	/// </summary>
	[Fact]
	public void Validate_Production_MfaDisabled_ThrowsInvalidOperationException()
	{
		IConfiguration configuration =
			BuildProductionConfig(mfaEnabled: false, totpEnabled: true, secureCookie: true, sameSiteLax: false);

		IHostEnvironment environment =
			CreateEnvironment(Environments.Production);

		InvalidOperationException exception =
			Should.Throw<InvalidOperationException>(
				() => _rule.Validate(configuration, environment, _logger));

		exception.Message.ShouldContain("Mfa:Enabled");
	}

	/// <summary>
	/// Verifies that production with TOTP disabled throws an <see cref="InvalidOperationException"/>.
	/// </summary>
	[Fact]
	public void Validate_Production_TotpDisabled_ThrowsInvalidOperationException()
	{
		IConfiguration configuration =
			BuildProductionConfig(mfaEnabled: true, totpEnabled: false, secureCookie: true, sameSiteLax: false);

		IHostEnvironment environment =
			CreateEnvironment(Environments.Production);

		InvalidOperationException exception =
			Should.Throw<InvalidOperationException>(
				() => _rule.Validate(configuration, environment, _logger));

		exception.Message.ShouldContain("Totp:Enabled");
	}

	/// <summary>
	/// Verifies that production with SecureCookie=false throws an <see cref="InvalidOperationException"/>.
	/// </summary>
	[Fact]
	public void Validate_Production_SecureCookieFalse_ThrowsInvalidOperationException()
	{
		IConfiguration configuration =
			BuildProductionConfig(mfaEnabled: true, totpEnabled: true, secureCookie: false, sameSiteLax: false);

		IHostEnvironment environment =
			CreateEnvironment(Environments.Production);

		InvalidOperationException exception =
			Should.Throw<InvalidOperationException>(
				() => _rule.Validate(configuration, environment, _logger));

		exception.Message.ShouldContain("Auth:Cookie:SecureCookie");
	}

	/// <summary>
	/// Verifies that production with SameSiteLax=true throws an <see cref="InvalidOperationException"/>.
	/// </summary>
	[Fact]
	public void Validate_Production_SameSiteLaxTrue_ThrowsInvalidOperationException()
	{
		IConfiguration configuration =
			BuildProductionConfig(mfaEnabled: true, totpEnabled: true, secureCookie: true, sameSiteLax: true);

		IHostEnvironment environment =
			CreateEnvironment(Environments.Production);

		InvalidOperationException exception =
			Should.Throw<InvalidOperationException>(
				() => _rule.Validate(configuration, environment, _logger));

		exception.Message.ShouldContain("Auth:Cookie:SameSiteLax");
	}

	/// <summary>
	/// Verifies that all violations are included when multiple settings are invalid.
	/// </summary>
	[Fact]
	public void Validate_Production_MultipleViolations_IncludesAllInExceptionMessage()
	{
		IConfiguration configuration =
			BuildProductionConfig(mfaEnabled: false, totpEnabled: false, secureCookie: false, sameSiteLax: true);

		IHostEnvironment environment =
			CreateEnvironment(Environments.Production);

		InvalidOperationException exception =
			Should.Throw<InvalidOperationException>(
				() => _rule.Validate(configuration, environment, _logger));

		exception.Message.ShouldContain("Mfa:Enabled");
		exception.Message.ShouldContain("Totp:Enabled");
		exception.Message.ShouldContain("Auth:Cookie:SecureCookie");
		exception.Message.ShouldContain("Auth:Cookie:SameSiteLax");
	}

	/// <summary>
	/// Verifies that all valid production settings logs information and does not throw.
	/// </summary>
	[Fact]
	public void Validate_Production_AllSettingsValid_DoesNotThrow()
	{
		IConfiguration configuration =
			BuildProductionConfig(mfaEnabled: true, totpEnabled: true, secureCookie: true, sameSiteLax: false);

		IHostEnvironment environment =
			CreateEnvironment(Environments.Production);

		Should.NotThrow(
			() => _rule.Validate(configuration, environment, _logger));
	}

	/// <summary>
	/// Verifies that production with all configuration sections absent does not throw.
	/// The rule uses null-pattern guards so absent sections produce no violations.
	/// </summary>
	[Fact]
	public void Validate_Production_AllSectionsMissing_DoesNotThrow()
	{
		IConfiguration configuration =
			new ConfigurationBuilder()
				.AddInMemoryCollection(new Dictionary<string, string?>())
				.Build();

		IHostEnvironment environment =
			CreateEnvironment(Environments.Production);

		Should.NotThrow(
			() => _rule.Validate(configuration, environment, _logger));
	}

	/// <summary>
	/// Verifies that production with valid MFA and TOTP but an absent Auth section does not throw.
	/// The null-conditional <c>authSettings?.Cookie</c> short-circuits when Auth is unbound.
	/// </summary>
	[Fact]
	public void Validate_Production_AuthSectionAbsent_WithValidMfaTotp_DoesNotThrow()
	{
		IConfiguration configuration =
			new ConfigurationBuilder()
				.AddInMemoryCollection(
					new Dictionary<string, string?>
					{
						["Mfa:Enabled"] = "true",
						["Totp:Enabled"] = "true",
					})
				.Build();

		IHostEnvironment environment =
			CreateEnvironment(Environments.Production);

		Should.NotThrow(
			() => _rule.Validate(configuration, environment, _logger));
	}

	private static IConfiguration BuildProductionConfig(
		bool mfaEnabled,
		bool totpEnabled,
		bool secureCookie,
		bool sameSiteLax)
	{
		Dictionary<string, string?> values =
			new()
			{
				["Mfa:Enabled"] = mfaEnabled.ToString(),
				["Totp:Enabled"] = totpEnabled.ToString(),
				["Auth:Cookie:SecureCookie"] = secureCookie.ToString(),
				["Auth:Cookie:SameSiteLax"] = sameSiteLax.ToString(),
			};

		return new ConfigurationBuilder()
			.AddInMemoryCollection(values)
			.Build();
	}

	private static IHostEnvironment CreateEnvironment(string environmentName)
	{
		IHostEnvironment environment =
			Substitute.For<IHostEnvironment>();
		environment.EnvironmentName.Returns(environmentName);
		return environment;
	}
}