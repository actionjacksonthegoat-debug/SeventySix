// <copyright file="DataProtectionRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using FluentValidation;
using Microsoft.AspNetCore.DataProtection;
using SeventySix.Api.Configuration;
using SeventySix.Shared.Registration;

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
		DataProtectionSettings dataProtectionOptions =
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
	private static DataProtectionSettings BindAndValidateOptions(
		IServiceCollection services,
		IConfiguration configuration,
		IWebHostEnvironment environment)
	{
		services.AddSingleton<
			IValidator<DataProtectionSettings>,
			DataProtectionSettingsValidator>();

		services
			.AddOptions<DataProtectionSettings>()
			.Bind(
				configuration.GetSection(
					DataProtectionSettings.SectionName))
			.ValidateWithFluentValidation()
			.ValidateOnStart();

		DataProtectionSettings? boundOptions =
			configuration
				.GetSection(DataProtectionSettings.SectionName)
				.Get<DataProtectionSettings>();

		return boundOptions ?? new DataProtectionSettings();
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
		DataProtectionSettings dataProtectionOptions,
		IWebHostEnvironment environment)
	{
		if (!string.IsNullOrWhiteSpace(dataProtectionOptions.KeysDirectory))
		{
			return dataProtectionOptions.KeysDirectory;
		}

		// All environments are Docker-based; use /app/keys in containers
		return environment.IsDevelopment()
			? Path.Join(
				Directory.GetCurrentDirectory(),
				DefaultKeysDirectory)
			: Path.Join("/app", DefaultKeysDirectory);
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
	/// <exception cref="InvalidOperationException">
	/// Thrown when certificate is required but cannot be loaded in production.
	/// In development, falls back to unprotected keys when certificate is unavailable.
	/// </exception>
	private static void ConfigureKeyProtection(
		IDataProtectionBuilder dataProtectionBuilder,
		DataProtectionSettings dataProtectionOptions,
		IWebHostEnvironment environment)
	{
		if (
			TryProtectWithCertificate(
				dataProtectionBuilder,
				dataProtectionOptions))
		{
			return;
		}

		// Fail fast in production if certificate was explicitly required
		if (!environment.IsDevelopment()
			&& dataProtectionOptions.UseCertificate)
		{
			throw new InvalidOperationException(
				"Data Protection certificate is required in production but could not be loaded. "
					+ "Configure DataProtection:CertificatePath with a valid PKCS#12 certificate "
					+ "or set DataProtection:UseCertificate to false (not recommended for production).");
		}

		// In production without certificate requirement, log warning
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
	/// Default certificate filename within the keys directory.
	/// </summary>
	private const string DefaultCertificateFilename = "dataprotection.pfx";

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
		DataProtectionSettings dataProtectionOptions)
	{
		if (!dataProtectionOptions.UseCertificate)
		{
			return false;
		}

		string? resolvedCertificatePath =
			ResolveCertificatePath(dataProtectionOptions.CertificatePath);

		if (resolvedCertificatePath is null)
		{
			return false;
		}

		try
		{
			X509Certificate2 certificate =
				X509CertificateLoader.LoadPkcs12FromFile(
					resolvedCertificatePath,
					dataProtectionOptions.CertificatePassword);

			dataProtectionBuilder.ProtectKeysWithCertificate(certificate);

			Serilog.Log.Information(
				"Data Protection keys protected with certificate: {Thumbprint}",
				certificate.Thumbprint);

			return true;
		}
		catch (CryptographicException certificateException)
		{
			Serilog.Log.Warning(
				certificateException,
				"Failed to load Data Protection certificate from {Path}",
				resolvedCertificatePath);

			return false;
		}
		catch (IOException certificateException)
		{
			Serilog.Log.Warning(
				certificateException,
				"Failed to load Data Protection certificate from {Path}",
				resolvedCertificatePath);

			return false;
		}
	}

	/// <summary>
	/// Resolves the certificate file path, checking the configured path first
	/// then falling back to the local keys directory.
	/// </summary>
	/// <remarks>
	/// <para>
	/// This supports both Docker containers (where the cert is mounted at
	/// <c>/app/keys/dataprotection.pfx</c>) and local F5 debugging (where
	/// the cert lives at <c>keys/dataprotection.pfx</c> relative to the
	/// project directory).
	/// </para>
	/// </remarks>
	/// <param name="configuredPath">
	/// The certificate path from configuration.
	/// </param>
	/// <returns>
	/// The resolved path if the certificate file exists; otherwise null.
	/// </returns>
	private static string? ResolveCertificatePath(string? configuredPath)
	{
		if (string.IsNullOrWhiteSpace(configuredPath))
		{
			return null;
		}

		// Configured path exists (Docker container or absolute path)
		if (File.Exists(configuredPath))
		{
			return configuredPath;
		}

		// Fallback: check local keys directory (F5 / local debugging)
		string localCertificatePath =
			Path.Join(
				Directory.GetCurrentDirectory(),
				DefaultKeysDirectory,
				DefaultCertificateFilename);

		if (File.Exists(localCertificatePath))
		{
			Serilog.Log.Information(
				"Data Protection certificate not found at {ConfiguredPath}, "
					+ "using local fallback at {LocalPath}",
				configuredPath,
				localCertificatePath);

			return localCertificatePath;
		}

		return null;
	}
}