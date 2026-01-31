// <copyright file="BreachedPasswordValidationExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;

namespace SeventySix.Identity;

/// <summary>
/// Extensions for breached password validation (OWASP ASVS V2.1.7).
/// </summary>
public static class BreachedPasswordValidationExtensions
{
	/// <summary>
	/// Validates that the password has not been found in known data breaches.
	/// </summary>
	/// <param name="breachCheck">
	/// The breach check dependencies container.
	/// </param>
	/// <param name="password">
	/// The password to validate.
	/// </param>
	/// <param name="logger">
	/// The logger instance.
	/// </param>
	/// <param name="operationName">
	/// The name of the operation (for logging purposes). Defaults to "Operation".
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// An <see cref="AuthResult"/> with error if breached; null if validation passed.
	/// </returns>
	public static async Task<AuthResult?> ValidatePasswordNotBreachedAsync(
		this BreachCheckDependencies breachCheck,
		string password,
		ILogger logger,
		string operationName = "Operation",
		CancellationToken cancellationToken = default)
	{
		BreachCheckResult result =
			await breachCheck.Service.CheckPasswordAsync(
				password,
				cancellationToken);

		if (result.IsBreached && breachCheck.Settings.Value.BreachedPassword.BlockBreachedPasswords)
		{
			logger.LogWarning(
				"{Operation} blocked: password found in {BreachCount} data breaches",
				operationName,
				result.BreachCount);

			return AuthResult.Failed(
				$"This password has been found in {result.BreachCount:N0} data breaches. "
					+ "Please choose a different password for your security.",
				AuthErrorCodes.BreachedPassword);
		}

		return null;
	}
}