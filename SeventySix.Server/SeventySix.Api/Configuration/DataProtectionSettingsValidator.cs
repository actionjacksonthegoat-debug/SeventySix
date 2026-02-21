// <copyright file="DataProtectionSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Api.Configuration;

/// <summary>
/// Validates <see cref="DataProtectionSettings"/> configuration values.
/// </summary>
public sealed class DataProtectionSettingsValidator : AbstractValidator<DataProtectionSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="DataProtectionSettingsValidator"/> class.
	/// </summary>
	public DataProtectionSettingsValidator()
	{
		When(
			dataProtection => dataProtection.UseCertificate,
			() =>
			{
				RuleFor(dataProtection => dataProtection.CertificatePath)
					.NotEmpty()
					.WithMessage("DataProtection:CertificatePath is required when UseCertificate is true");

				RuleFor(dataProtection => dataProtection.CertificatePassword)
					.NotEmpty()
					.WithMessage("DataProtection:CertificatePassword is required when UseCertificate is true");
			});
	}
}