// <copyright file="AltchaService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace SeventySix.Identity;

/// <summary>
/// Service for ALTCHA Proof-of-Work captcha generation and validation.
/// </summary>
/// <remarks>
/// Uses Ixnas.AltchaNet library for challenge generation and verification.
/// Stores verified challenges to prevent replay attacks.
/// </remarks>
/// <param name="altchaLibraryService">
/// The configured Ixnas.AltchaNet service instance from DI.
/// </param>
/// <param name="settings">
/// ALTCHA configuration settings.
/// </param>
/// <param name="logger">
/// Logger instance for diagnostics.
/// </param>
public sealed class AltchaService(
	Ixnas.AltchaNet.AltchaService altchaLibraryService,
	IOptions<AltchaSettings> settings,
	ILogger<AltchaService> logger) : IAltchaService
{
	/// <inheritdoc/>
	public bool IsEnabled =>
		settings.Value.Enabled;

	/// <inheritdoc/>
	public AltchaChallengeDto GenerateChallenge()
	{
		Ixnas.AltchaNet.AltchaChallenge challenge =
			altchaLibraryService.Generate();

		return new AltchaChallengeDto(
			Algorithm: challenge.Algorithm,
			Challenge: challenge.Challenge,
			MaxNumber: challenge.Maxnumber,
			Salt: challenge.Salt,
			Signature: challenge.Signature);
	}

	/// <inheritdoc/>
	public async Task<AltchaValidationResult> ValidateAsync(
		string payload,
		CancellationToken cancellationToken = default)
	{
		if (!settings.Value.Enabled)
		{
			return AltchaValidationResult.Bypassed();
		}

		if (string.IsNullOrWhiteSpace(payload))
		{
			logger.LogWarning("ALTCHA payload is missing or empty");
			return AltchaValidationResult.Failed(AltchaErrorCodes.MissingPayload);
		}

		try
		{
			Ixnas.AltchaNet.AltchaValidationResult libraryResult =
				await altchaLibraryService.Validate(
					payload,
					cancellationToken);

			if (!libraryResult.IsValid)
			{
				logger.LogWarning(
					"ALTCHA validation failed: {Error}",
					libraryResult.ValidationError?.Message ?? "Unknown error");

				string errorCode =
					libraryResult.ValidationError?.Code.ToString()
					?? AltchaErrorCodes.ValidationFailed;

				return AltchaValidationResult.Failed(errorCode);
			}

			return AltchaValidationResult.Succeeded();
		}
		catch (InvalidOperationException exception)
		{
			logger.LogError(
				exception,
				"ALTCHA validation error");
			return AltchaValidationResult.Failed(AltchaErrorCodes.InternalError);
		}
	}
}