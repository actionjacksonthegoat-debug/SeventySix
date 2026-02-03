// <copyright file="OptionsBuilderFluentValidationExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using FluentValidation.Results;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace SeventySix.Shared.Registration;

/// <summary>
/// Extension methods for integrating FluentValidation with .NET Options validation.
/// Provides ValidateOnStart integration using FluentValidation validators.
/// </summary>
/// <remarks>
/// This follows .NET 10 best practices for options validation by:
/// - Using IValidateOptions for startup validation
/// - Integrating with FluentValidation for consistent validation rules
/// - Providing clear error messages on configuration failure
/// </remarks>
public static class OptionsBuilderFluentValidationExtensions
{
	/// <summary>
	/// Adds FluentValidation-based validation to an options builder.
	/// Enables fail-fast validation on application startup.
	/// </summary>
	/// <typeparam name="TOptions">
	/// The options type to validate.
	/// </typeparam>
	/// <param name="optionsBuilder">
	/// The options builder instance.
	/// </param>
	/// <returns>
	/// The options builder for chaining.
	/// </returns>
	/// <example>
	/// <code>
	/// services
	///     .AddOptions&lt;RateLimitingSettings&gt;()
	///     .BindConfiguration("RateLimiting")
	///     .ValidateWithFluentValidation()
	///     .ValidateOnStart();
	/// </code>
	/// </example>
	public static OptionsBuilder<TOptions> ValidateWithFluentValidation<TOptions>(
		this OptionsBuilder<TOptions> optionsBuilder)
		where TOptions : class
	{
		optionsBuilder.Services.AddSingleton<IValidateOptions<TOptions>>(
			serviceProvider =>
				new FluentValidationOptionsValidator<TOptions>(
					serviceProvider,
					optionsBuilder.Name));

		return optionsBuilder;
	}
}

/// <summary>
/// Options validator that uses FluentValidation for validation logic.
/// Implements IValidateOptions for integration with .NET Options pattern.
/// </summary>
/// <typeparam name="TOptions">
/// The options type to validate.
/// </typeparam>
internal sealed class FluentValidationOptionsValidator<TOptions>(
	IServiceProvider serviceProvider,
	string? name) : IValidateOptions<TOptions>
	where TOptions : class
{
	/// <summary>
	/// Validates the options instance using the registered FluentValidation validator.
	/// </summary>
	/// <param name="optionsName">
	/// The name of the options instance being validated.
	/// </param>
	/// <param name="options">
	/// The options instance to validate.
	/// </param>
	/// <returns>
	/// A ValidateOptionsResult indicating success or failure with error messages.
	/// </returns>
	public ValidateOptionsResult Validate(
		string? optionsName,
		TOptions options)
	{
		// Only validate if this is the correct named options instance
		if (name is not null && name != optionsName)
		{
			return ValidateOptionsResult.Skip;
		}

		IValidator<TOptions>? validator =
			serviceProvider.GetService<IValidator<TOptions>>();

		if (validator is null)
		{
			// No validator registered, skip validation
			return ValidateOptionsResult.Skip;
		}

		ValidationResult validationResult =
			validator.Validate(options);

		if (validationResult.IsValid)
		{
			return ValidateOptionsResult.Success;
		}

		IEnumerable<string> errors =
			validationResult.Errors.Select(
				error => $"{error.PropertyName}: {error.ErrorMessage}");

		return ValidateOptionsResult.Fail(errors);
	}
}