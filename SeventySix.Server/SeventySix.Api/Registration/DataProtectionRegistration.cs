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
/// Configures:
/// - Key persistence to file system (supports Docker volume mounts)
/// - Key encryption using DPAPI (Windows) or ephemeral keys (Linux/Container)
/// - Application discriminator for key isolation
///
/// In containerized environments, mount /app/keys as a Docker volume to persist
/// keys across container restarts. Without persistence, users would be logged out
/// when containers restart.
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
	/// Application discriminator for key isolation.
	/// </summary>
	private const string DataProtectionSection = "DataProtection";

	/// <summary>
	/// Adds configured Data Protection services with key persistence and encryption.
	/// </summary>
	/// <remarks>
	/// Key storage location:
	/// - Development: ./keys (relative to app root)
	/// - Production/Container: /app/keys (mount as Docker volume)
	///
	/// Key protection:
	/// - Windows: Uses DPAPI (machine-level encryption)
	/// - Linux/Container: Uses unencrypted keys (secure via file permissions)
	///
	/// For production on Linux, consider:
	/// - Using Azure Key Vault: .ProtectKeysWithAzureKeyVault()
	/// - Using a certificate: .ProtectKeysWithCertificate()
	/// - Ensuring proper file system permissions (600)
	/// </remarks>
	/// <remarks>
	/// Ensure /app/keys is mounted as a Docker volume in containerized deployments
	/// to persist keys across restarts.
	/// </remarks>
	/// <param name="services">
	/// The service collection to register Data Protection services into.
	/// </param>
	/// <param name="configuration">
	/// The application configuration containing the <c>DataProtection</c> section.
	/// </param>
	/// <param name="environment">The current web host environment used to determine key storage location.
	/// </param>
	/// <returns>
	/// The supplied <see cref="IServiceCollection"/> for chaining.
	/// </returns>
	public static IServiceCollection AddConfiguredDataProtection(
		this IServiceCollection services,
		IConfiguration configuration,
		IWebHostEnvironment environment)
	{
		// Bind options and validate on start
		services
			.AddOptions<AppDataProtectionOptions>()
			.Bind(configuration.GetSection(DataProtectionSection))
			.Validate(
				options =>
				{
					if (options.UseCertificatePath)
					{
						return !string.IsNullOrWhiteSpace(options.CertificatePath)
							&& File.Exists(options.CertificatePath);
					}

					// If Azure Key Vault is requested, ensure a URL is provided
					if (options.UseAzureKeyVault)
					{
						return !string.IsNullOrWhiteSpace(options.KeyVaultUrl);
					}

					// Basic validation sufficient for now
					return true;
				},
				"Invalid DataProtection configuration")
			.ValidateOnStart();

		// Determine keys directory based on environment
		// In containers, /app/keys should be mounted as a volume
		string keysDirectory =
			environment.IsDevelopment()
				? Path.Combine(
					Directory.GetCurrentDirectory(),
					DefaultKeysDirectory)
				: Path.Combine("/app", DefaultKeysDirectory);

		// Ensure the directory exists
		if (!Directory.Exists(keysDirectory))
		{
			Directory.CreateDirectory(keysDirectory);
		}

		EnsureKeysDirectoryHasRestrictivePermissions(keysDirectory);

		IDataProtectionBuilder dataProtectionBuilder =
			services
				.AddDataProtection()
				.SetApplicationName(ApplicationName)
				.PersistKeysToFileSystem(new DirectoryInfo(keysDirectory));

		// Protect keys: DPAPI on Windows and certificate when configured
		ProtectKeysWithDpapiIfWindows(dataProtectionBuilder);
		ProtectKeysWithCertificateFromConfig(dataProtectionBuilder, configuration);

		return services;
	}

	/// <summary>
	/// Applies DPAPI key protection when running on Windows.
	/// </summary>
	/// <param name="dataProtectionBuilder">
	/// The <see cref="IDataProtectionBuilder"/> used to configure key protection.
	/// </param>
	private static void ProtectKeysWithDpapiIfWindows(IDataProtectionBuilder dataProtectionBuilder)
	{
		// On Windows, use DPAPI for key encryption. On Linux/containers, keys are
		// protected by filesystem permissions or key vaults (not configured here).
		if (OperatingSystem.IsWindows())
		{
			dataProtectionBuilder.ProtectKeysWithDpapi(
				protectToLocalMachine: true);
		}
	}
	/// <summary>
	/// Ensures the keys directory exists and has restrictive Unix permissions (0700) on non-Windows platforms.
	/// Throws <see cref="InvalidOperationException"/> if permissions cannot be set or verified.
	/// </summary>
	/// <param name="keysDirectory">
	/// Absolute path to the directory where keys are stored.
	/// </param>
	private static void EnsureKeysDirectoryHasRestrictivePermissions(string keysDirectory)
	{
		if (!OperatingSystem.IsWindows())
		{
			try
			{
				// Set unix file mode to 0700 for the keys directory - this is a security requirement
				File.SetUnixFileMode(
					keysDirectory,
					UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);

				// Verify the mode was applied; if not, fail startup to notify deployers
				UnixFileMode appliedMode =
					File.GetUnixFileMode(keysDirectory);

				UnixFileMode expectedMode =
					UnixFileMode.UserRead
					| UnixFileMode.UserWrite
					| UnixFileMode.UserExecute;

				if ((appliedMode & expectedMode) != expectedMode)
				{
					string fullMessage =
						string.Concat(
							$"Keys directory '{keysDirectory}' does not have restrictive permissions (expected 0700).",
							$" Current mode: {appliedMode}.",
							" This is a security requirement; ensure the filesystem supports unix ",
							"file modes and the process can set permissions.");

					throw new InvalidOperationException(fullMessage);
				}
			}
			catch (PlatformNotSupportedException ex)
			{
				string platformFullMessage =
					string.Concat(
						$"Unable to set restrictive permissions on keys directory '{keysDirectory}'",
						" because the platform does not support unix file modes.",
						" Ensure the container's filesystem supports chmod and notify the Deploy team.");

				throw new InvalidOperationException(platformFullMessage, ex);
			}
			catch (Exception ex)
			{
				string errorFullMessage =
					string.Concat(
						$"Failed to set restrictive permissions (0700) on keys directory '{keysDirectory}'.",
						" This is a security requirement; ensure the directory is mounted correctly ",
						"(ext4/posix fs) and the process has permission to change modes.",
						$" Notify the Deploy team. Inner: {ex.Message}");

				throw new InvalidOperationException(errorFullMessage, ex);
			}
		}
	}

	/// <summary>
	/// If configured, loads a PKCS#12 certificate from configuration and protects keys with it.
	/// </summary>
	/// <param name="dataProtectionBuilder">
	/// The <see cref="IDataProtectionBuilder"/> used to configure key protection.
	/// </param>
	/// <param name="configuration">
	/// Application configuration containing the <c>DataProtection</c> section.
	/// </param>
	private static void ProtectKeysWithCertificateFromConfig(IDataProtectionBuilder dataProtectionBuilder, IConfiguration configuration)
	{
		AppDataProtectionOptions? dataProtectionOptions =
			configuration
				.GetSection(DataProtectionSection)
				.Get<AppDataProtectionOptions>();

		if (dataProtectionOptions?.UseCertificatePath == true
			&& !string.IsNullOrWhiteSpace(dataProtectionOptions.CertificatePath)
			&& File.Exists(dataProtectionOptions.CertificatePath))
		{
			X509Certificate2 certificate =
				X509CertificateLoader.LoadPkcs12FromFile(
					dataProtectionOptions.CertificatePath,
					dataProtectionOptions.CertificatePassword);

			dataProtectionBuilder.ProtectKeysWithCertificate(certificate);
		}
	}
}