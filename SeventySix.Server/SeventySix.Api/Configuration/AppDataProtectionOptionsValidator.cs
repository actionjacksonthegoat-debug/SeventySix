// <copyright file="AppDataProtectionOptionsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Api.Configuration;

/// <summary>
/// Validates <see cref="AppDataProtectionOptions"/> configuration values.
/// </summary>
public sealed class AppDataProtectionOptionsValidator : AbstractValidator<AppDataProtectionOptions>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="AppDataProtectionOptionsValidator"/> class.
	/// </summary>
	public AppDataProtectionOptionsValidator()
	{
		When(
			dataProtection => dataProtection.UseCertificate,
			() =>
			{
				RuleFor(dataProtection => dataProtection.CertificatePath)
					.NotEmpty()
					.WithMessage("DataProtection:CertificatePath is required when UseCertificate is true");
			});
	}
}