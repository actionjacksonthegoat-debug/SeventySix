// <copyright file="DomainSettingsRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace SeventySix.Shared.Registration;

/// <summary>
/// Extension methods for registering domain settings with FluentValidation and startup validation.
/// Centralizes the repeated pattern of validator registration + options binding + FluentValidation + ValidateOnStart.
/// </summary>
public static class DomainSettingsRegistration
{
	/// <summary>
	/// Registers a domain settings type with its FluentValidation validator,
	/// binds it to a configuration section, and enables fail-fast startup validation.
	/// </summary>
	/// <typeparam name="TSettings">
	/// The settings record type to bind and validate.
	/// </typeparam>
	/// <typeparam name="TValidator">
	/// The FluentValidation validator for the settings type.
	/// </typeparam>
	/// <param name="services">
	/// The service collection.
	/// </param>
	/// <param name="configuration">
	/// The application configuration to bind settings from.
	/// </param>
	/// <param name="sectionName">
	/// The configuration section name (typically <c>TSettings.SectionName</c>).
	/// </param>
	/// <returns>
	/// The service collection for chaining.
	/// </returns>
	public static IServiceCollection AddDomainSettings<TSettings, TValidator>(
		this IServiceCollection services,
		IConfiguration configuration,
		string sectionName)
		where TSettings : class
		where TValidator : class, IValidator<TSettings>
	{
		services.AddSingleton<IValidator<TSettings>, TValidator>();

		services
			.AddOptions<TSettings>()
			.Bind(configuration.GetSection(sectionName))
			.ValidateWithFluentValidation()
			.ValidateOnStart();

		return services;
	}
}