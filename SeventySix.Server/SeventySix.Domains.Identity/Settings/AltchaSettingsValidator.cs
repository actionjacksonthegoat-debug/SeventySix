// <copyright file="AltchaSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System;
using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// Validates <see cref="AltchaSettings"/> configuration values.
/// </summary>
public sealed class AltchaSettingsValidator : AbstractValidator<AltchaSettings>
{
	/// <summary>
	/// Required HMAC key size in bytes for Ixnas.AltchaNet SHA-256.
	/// </summary>
	private const int RequiredHmacKeyBytes = 64;

	/// <summary>
	/// Initializes a new instance of the <see cref="AltchaSettingsValidator"/> class.
	/// </summary>
	public AltchaSettingsValidator()
	{
		When(
			altcha => altcha.Enabled,
			() =>
			{
				RuleFor(altcha => altcha.HmacKeyBase64)
					.NotEmpty()
					.WithMessage("Altcha:HmacKeyBase64 is required when Altcha is enabled");

				RuleFor(altcha => altcha.HmacKeyBase64)
					.Must(BeValidBase64WithExactly64Bytes)
					.When(altcha => !string.IsNullOrWhiteSpace(altcha.HmacKeyBase64))
					.WithMessage(
						$"Altcha:HmacKeyBase64 must be valid base64 that decodes to exactly {RequiredHmacKeyBytes} bytes. "
						+ "Generate with: openssl rand -base64 64");

				RuleFor(altcha => altcha.ComplexityMin)
					.GreaterThan(0)
					.WithMessage("Altcha:ComplexityMin must be greater than 0");

				RuleFor(altcha => altcha.ComplexityMax)
					.GreaterThanOrEqualTo(altcha => altcha.ComplexityMin)
					.WithMessage("Altcha:ComplexityMax must be >= ComplexityMin");

				RuleFor(altcha => altcha.ExpirySeconds)
					.GreaterThan(0)
					.WithMessage("Altcha:ExpirySeconds must be greater than 0");
			});
	}

	/// <summary>
	/// Validates that the base64 string decodes to exactly 64 bytes.
	/// </summary>
	/// <param name="hmacKeyBase64">
	/// The base64-encoded HMAC key.
	/// </param>
	/// <returns>
	/// <see langword="true"/> if the key decodes to exactly 64 bytes.
	/// </returns>
	private static bool BeValidBase64WithExactly64Bytes(string hmacKeyBase64)
	{
		try
		{
			byte[] decoded =
				Convert.FromBase64String(hmacKeyBase64);

			return decoded.Length == RequiredHmacKeyBytes;
		}
		catch (FormatException)
		{
			return false;
		}
	}
}