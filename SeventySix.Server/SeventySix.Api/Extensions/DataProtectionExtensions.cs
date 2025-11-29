// <copyright file="DataProtectionExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.DataProtection;

namespace SeventySix.Api.Extensions;

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
	private const string DEFAULT_KEYS_DIRECTORY = "keys";

	/// <summary>
	/// Application discriminator for key isolation.
	/// </summary>
	private const string APPLICATION_NAME = "SeventySix";

	/// <summary>
	/// Adds configured Data Protection services with key persistence and encryption.
	/// </summary>
	/// <param name="services">The service collection.</param>
	/// <param name="environment">The web host environment.</param>
	/// <returns>The service collection for chaining.</returns>
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
	public static IServiceCollection AddConfiguredDataProtection(
		this IServiceCollection services,
		IWebHostEnvironment environment)
	{
		// Determine keys directory based on environment
		// In containers, /app/keys should be mounted as a volume
		string keysDirectory =
			environment.IsDevelopment()
				? Path.Combine(
					Directory.GetCurrentDirectory(),
					DEFAULT_KEYS_DIRECTORY)
				: Path.Combine(
					"/app",
					DEFAULT_KEYS_DIRECTORY);

		// Ensure the directory exists
		if (!Directory.Exists(keysDirectory))
		{
			Directory.CreateDirectory(keysDirectory);
		}

		IDataProtectionBuilder dataProtectionBuilder =
			services
				.AddDataProtection()
				.SetApplicationName(APPLICATION_NAME)
				.PersistKeysToFileSystem(new DirectoryInfo(keysDirectory));

		// On Windows, use DPAPI for key encryption
		// On Linux/containers, keys are stored unencrypted but should be
		// protected via file system permissions or mounted secrets
		if (OperatingSystem.IsWindows())
		{
			dataProtectionBuilder.ProtectKeysWithDpapi(
				protectToLocalMachine: true);
		}

		// For Linux production environments, consider adding certificate-based protection:
		// else if (!environment.IsDevelopment())
		// {
		//     var certPath = configuration["DataProtection:CertificatePath"];
		//     var certPassword = configuration["DataProtection:CertificatePassword"];
		//     if (!string.IsNullOrEmpty(certPath))
		//     {
		//         var certificate = new X509Certificate2(certPath, certPassword);
		//         dataProtectionBuilder.ProtectKeysWithCertificate(certificate);
		//     }
		// }

		return services;
	}
}
