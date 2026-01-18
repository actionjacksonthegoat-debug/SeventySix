// <copyright file="DataProtectionRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Security.Cryptography.X509Certificates;
using Microsoft.AspNetCore.DataProtection;
using SeventySix.Api.Configuration;

namespace SeventySix.Api.Registration;

/// <summary>
/// Extension methods for configuring ASP.NET Core Data Protection.
/// </summary>
/// <remarks>
/// <para>
/// Provides unified key management across all Docker-based environments:
/// </para>
/// <list type="bullet">
/// <item>Development (Docker Container via VS): Certificate from mounted path or unprotected fallback</item>
/// <item>Full Stack (Docker Compose): Certificate from volume-mounted path</item>
/// <item>Production: Certificate from secure mount (required for encryption at rest)</item>
/// </list>
/// <para>
/// Key Storage: Keys are persisted to the filesystem and should be mounted
/// as a Docker volume for persistence across container restarts.
/// </para>
/// </remarks>
public static class DataProtectionExtensions
{
	/// <summary>
	/// Default directory name for data protection keys.
	/// </summary>
	private const string DefaultKeysDirectory = "keys";

	/// <summary>
	/// Application discriminator for key isolation.
	/// </summary>
	private const string ApplicationName = "SeventySix";

	/// <summary>
	/// Configuration section name for data protection options.
	/// </summary>
	private const string DataProtectionSection = "DataProtection";

	/// <summary>
	/// Adds configured Data Protection services with key persistence and encryption.
	/// </summary>
	/// <param name="services">
	/// The service collection to register Data Protection services into.
	/// </param>
	/// <param name="configuration">
	/// The application configuration containing the <c>DataProtection</c> section.
	/// </param>
	/// <param name="environment">
	/// The current web host environment used to determine key storage and protection behavior.
	/// </param>
	/// <returns>
	/// The supplied <see cref="IServiceCollection"/> for chaining.
	/// </returns>
	public static IServiceCollection AddConfiguredDataProtection(
		this IServiceCollection services,
		IConfiguration configuration,
		IWebHostEnvironment environment)
	{
		AppDataProtectionOptions dataProtectionOptions =
			BindAndValidateOptions(
				services,
				configuration,
				environment);

		string keysDirectory =
			ResolveKeysDirectory(
				dataProtectionOptions,
				environment);

		EnsureKeysDirectoryExists(keysDirectory);

		IDataProtectionBuilder dataProtectionBuilder =
			services
				.AddDataProtection()
				.SetApplicationName(ApplicationName)
				.PersistKeysToFileSystem(new DirectoryInfo(keysDirectory));

		ConfigureKeyProtection(
			dataProtectionBuilder,
			dataProtectionOptions,
			environment);

		return services;
	}

	/// <summary>
	/// Binds and validates Data Protection options from configuration.
	/// </summary>
	/// <param name="services">
	/// The service collection for options registration.
	/// </param>
	/// <param name="configuration">
	/// The application configuration.
	/// </param>
	/// <param name="environment">
	/// The current web host environment.
	/// </param>
	/// <returns>
	/// The bound and validated options instance.
	/// </returns>
	private static AppDataProtectionOptions BindAndValidateOptions(
		IServiceCollection services,
		IConfiguration configuration,
		IWebHostEnvironment environment)
	{
		services
			.AddOptions<AppDataProtectionOptions>()
			.Bind(configuration.GetSection(DataProtectionSection))
			.Validate(
				dataProtectionOptions =>
					ValidateOptions(dataProtectionOptions, environment),
				"Invalid DataProtection configuration: Certificate path missing or file not found")
			.ValidateOnStart();

		AppDataProtectionOptions? boundOptions =
			configuration
				.GetSection(DataProtectionSection)
				.Get<AppDataProtectionOptions>();

		return boundOptions ?? new AppDataProtectionOptions();
	}

	/// <summary>
	/// Validates Data Protection options based on environment.
	/// </summary>
	/// <param name="dataProtectionOptions">
	/// The options to validate.
	/// </param>
	/// <param name="environment">
	/// The current hosting environment.
	/// </param>
	/// <returns>
	/// True if options are valid; otherwise false.
	/// </returns>
	private static bool ValidateOptions(
		AppDataProtectionOptions dataProtectionOptions,
		IWebHostEnvironment environment)
	{
		if (!dataProtectionOptions.UseCertificate)
		{
			return true;
		}

		bool certificateExists =
			!string.IsNullOrWhiteSpace(dataProtectionOptions.CertificatePath)
			&& File.Exists(dataProtectionOptions.CertificatePath);

		if (certificateExists)
		{
			return true;
		}

		// In development with fallback allowed, accept missing certificate
		if (environment.IsDevelopment())
		{
			return dataProtectionOptions.AllowUnprotectedKeysInDevelopment;
		}

		return false;
	}

	/// <summary>
	/// Resolves the keys directory path based on options and environment.
	/// </summary>
	/// <param name="dataProtectionOptions">
	/// The data protection options.
	/// </param>
	/// <param name="environment">
	/// The current hosting environment.
	/// </param>
	/// <returns>
	/// The absolute path to the keys directory.
	/// </returns>
	private static string ResolveKeysDirectory(
		AppDataProtectionOptions dataProtectionOptions,
		IWebHostEnvironment environment)
	{
		if (!string.IsNullOrWhiteSpace(dataProtectionOptions.KeysDirectory))
		{
			return dataProtectionOptions.KeysDirectory;
		}

		// All environments are Docker-based; use /app/keys in containers
		return environment.IsDevelopment()
			? Path.Combine(
				Directory.GetCurrentDirectory(),
				DefaultKeysDirectory)
			: Path.Combine("/app", DefaultKeysDirectory);
	}

	/// <summary>
	/// Ensures the keys directory exists, creating it if necessary.
	/// </summary>
	/// <param name="keysDirectory">
	/// The path to the keys directory.
	/// </param>
	private static void EnsureKeysDirectoryExists(string keysDirectory)
	{
		if (!Directory.Exists(keysDirectory))
		{
			Directory.CreateDirectory(keysDirectory);
		}
	}

	/// <summary>
	/// Configures key protection strategy based on options and environment.
	/// </summary>
	/// <param name="dataProtectionBuilder">
	/// The data protection builder.
	/// </param>
	/// <param name="dataProtectionOptions">
	/// The data protection options.
	/// </param>
	/// <param name="environment">
	/// The current hosting environment.
	/// </param>
	private static void ConfigureKeyProtection(
		IDataProtectionBuilder dataProtectionBuilder,
		AppDataProtectionOptions dataProtectionOptions,
		IWebHostEnvironment environment)
	{
		if (
			TryProtectWithCertificate(
				dataProtectionBuilder,
				dataProtectionOptions))
		{
			return;
		}

		// In production without certificate, log warning
		// Keys will be stored unencrypted (protected by filesystem permissions)
		if (!environment.IsDevelopment())
		{
			Serilog.Log.Warning(
				"Data Protection keys are NOT encrypted at rest. "
					+ "Configure DataProtection:UseCertificate and DataProtection:CertificatePath "
					+ "for production security");
		}
	}

	/// <summary>
	/// Attempts to protect keys with a certificate from configuration.
	/// </summary>
	/// <param name="dataProtectionBuilder">
	/// The data protection builder.
	/// </param>
	/// <param name="dataProtectionOptions">
	/// The data protection options.
	/// </param>
	/// <returns>
	/// True if certificate protection was configured; otherwise false.
	/// </returns>
	private static bool TryProtectWithCertificate(
		IDataProtectionBuilder dataProtectionBuilder,
		AppDataProtectionOptions dataProtectionOptions)
	{
		if (!dataProtectionOptions.UseCertificate)
		{
			return false;
		}

		if (string.IsNullOrWhiteSpace(dataProtectionOptions.CertificatePath))
		{
			return false;
		}

		if (!File.Exists(dataProtectionOptions.CertificatePath))
		{
			return false;
		}

		try
		{
			X509Certificate2 certificate =
				X509CertificateLoader.LoadPkcs12FromFile(
					dataProtectionOptions.CertificatePath,
					dataProtectionOptions.CertificatePassword);

			dataProtectionBuilder.ProtectKeysWithCertificate(certificate);

			Serilog.Log.Information(
				"Data Protection keys protected with certificate: {Thumbprint}",
				certificate.Thumbprint);

			return true;
		}
		catch (Exception certificateException)
		{
			Serilog.Log.Warning(
				certificateException,
				"Failed to load Data Protection certificate from {Path}",
				dataProtectionOptions.CertificatePath);

			return false;
		}
	}
}