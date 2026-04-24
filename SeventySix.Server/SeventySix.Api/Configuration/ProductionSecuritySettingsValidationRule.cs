// <copyright file="ProductionSecuritySettingsValidationRule.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Identity;

namespace SeventySix.Api.Configuration;

/// <summary>
/// Validates that security-critical settings are enabled in production.
/// MFA and TOTP must be enabled; secure cookie settings must be configured.
/// </summary>
internal sealed class ProductionSecuritySettingsValidationRule : IStartupValidationRule
{
	/// <inheritdoc />
	public void Validate(
		IConfiguration configuration,
		IHostEnvironment environment,
		ILogger logger)
	{
		ArgumentNullException.ThrowIfNull(configuration);
		ArgumentNullException.ThrowIfNull(environment);
		ArgumentNullException.ThrowIfNull(logger);

		if (!environment.IsProduction())
		{
			return;
		}

		List<string> violations = [];

		MfaSettings? mfaSettings =
			configuration.GetSection(MfaSettings.SectionName).Get<MfaSettings>();

		if (mfaSettings is { Enabled: false })
		{
			violations.Add("Mfa:Enabled must be true in Production environment");
		}

		TotpSettings? totpSettings =
			configuration.GetSection(TotpSettings.SectionName).Get<TotpSettings>();

		if (totpSettings is { Enabled: false })
		{
			violations.Add("Totp:Enabled must be true in Production environment");
		}

		AuthSettings? authSettings =
			configuration.GetSection(AuthSettings.SectionName).Get<AuthSettings>();

		if (authSettings?.Cookie is { SecureCookie: false })
		{
			violations.Add("Auth:Cookie:SecureCookie must be true in Production environment");
		}

		if (authSettings?.Cookie is { SameSiteLax: true })
		{
			violations.Add("Auth:Cookie:SameSiteLax must be false in Production environment");
		}

		if (violations.Count > 0)
		{
			foreach (string violation in violations)
			{
				logger.LogError(
					"Production security violation: {Violation}",
					violation);
			}

			throw new InvalidOperationException(
				$"Production security validation failed: {string.Join("; ", violations)}");
		}

		logger.LogInformation(
			"Production security settings validation passed");
	}
}