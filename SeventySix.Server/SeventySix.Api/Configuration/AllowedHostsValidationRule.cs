// <copyright file="AllowedHostsValidationRule.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Configuration;

/// <summary>
/// Validates that <c>AllowedHosts</c> is not a wildcard (<c>*</c>) in production.
/// </summary>
internal sealed class AllowedHostsValidationRule : IStartupValidationRule
{
	/// <inheritdoc />
	public void Validate(
		IConfiguration configuration,
		IHostEnvironment environment,
		ILogger _)
	{
		ArgumentNullException.ThrowIfNull(configuration);
		ArgumentNullException.ThrowIfNull(environment);

		if (!environment.IsProduction())
		{
			return;
		}

		string? allowedHosts =
			configuration["AllowedHosts"];

		if (string.Equals(
			allowedHosts,
			"*",
			StringComparison.Ordinal))
		{
			throw new InvalidOperationException(
				"AllowedHosts must not be '*' in production. "
					+ "Configure specific hostnames in appsettings.Production.json.");
		}
	}
}