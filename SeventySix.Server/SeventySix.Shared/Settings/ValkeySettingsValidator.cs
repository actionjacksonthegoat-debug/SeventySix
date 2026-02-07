// <copyright file="ValkeySettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Shared.Settings;

/// <summary>
/// FluentValidation validator for ValkeySettings.
/// Ensures Valkey/Redis cache configuration is valid at startup.
/// </summary>
/// <remarks>
/// Validates:
/// - ConnectionString is not empty when Valkey is enabled
/// - InstanceName follows proper naming conventions
/// - Timeout values are within reasonable bounds
///
/// This validator is used at application startup to fail fast
/// if Valkey configuration is invalid.
/// </remarks>
public sealed class ValkeySettingsValidator : AbstractValidator<ValkeySettings>
{
	/// <summary>
	/// Minimum timeout value in milliseconds.
	/// </summary>
	public const int MinTimeoutMs = 100;

	/// <summary>
	/// Maximum timeout value in milliseconds (30 seconds).
	/// </summary>
	public const int MaxTimeoutMs = 30000;

	/// <summary>
	/// Initializes a new instance of the <see cref="ValkeySettingsValidator"/> class.
	/// </summary>
	public ValkeySettingsValidator()
	{
		When(
			settings => settings.Enabled,
			() =>
			{
				RuleFor(settings => settings.ConnectionString)
					.NotEmpty()
					.WithMessage("Valkey ConnectionString is required when Valkey is enabled");

				RuleFor(settings => settings.InstanceName)
					.NotEmpty()
					.WithMessage("Valkey InstanceName is required");

				RuleFor(settings => settings.ConnectTimeoutMs)
					.InclusiveBetween(
						MinTimeoutMs,
						MaxTimeoutMs)
					.WithMessage($"ConnectTimeoutMs must be between {MinTimeoutMs}ms and {MaxTimeoutMs}ms");

				RuleFor(settings => settings.SyncTimeoutMs)
					.InclusiveBetween(
						MinTimeoutMs,
						MaxTimeoutMs)
					.WithMessage($"SyncTimeoutMs must be between {MinTimeoutMs}ms and {MaxTimeoutMs}ms");

				RuleFor(settings => settings.AsyncTimeoutMs)
					.InclusiveBetween(
						MinTimeoutMs,
						MaxTimeoutMs)
					.WithMessage($"AsyncTimeoutMs must be between {MinTimeoutMs}ms and {MaxTimeoutMs}ms");

				RuleFor(settings => settings.ConnectRetry)
					.InclusiveBetween(
						1,
						10)
					.WithMessage("ConnectRetry must be between 1 and 10");

				RuleFor(settings => settings.ConnectionPoolSize)
					.InclusiveBetween(
						1,
						20)
					.WithMessage("ConnectionPoolSize must be between 1 and 20");
			});
	}
}