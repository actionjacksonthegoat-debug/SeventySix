namespace SeventySix.Api.Configuration;

/// <summary>
/// Options for configuring ASP.NET Core Data Protection key storage and encryption.
/// </summary>
/// <remarks>
/// <para>
/// All paths support both absolute paths and environment-relative paths.
/// Certificate-based protection is recommended for cross-platform compatibility
/// in Docker environments.
/// </para>
/// <para>
/// Configuration is loaded from the <c>DataProtection</c> section in appsettings.
/// </para>
/// </remarks>
public record AppDataProtectionOptions
{
	/// <summary>
	/// Configuration section name for binding.
	/// </summary>
	public const string SectionName = "DataProtection";

	/// <summary>
	/// Directory path where data protection keys are stored.
	/// </summary>
	/// <remarks>
	/// <para>
	/// When null or empty, uses environment-specific defaults:
	/// </para>
	/// <list type="bullet">
	/// <item>Development: ./keys (relative to app root)</item>
	/// <item>Production/Container: /app/keys</item>
	/// </list>
	/// </remarks>
	public string? KeysDirectory { get; init; }

	/// <summary>
	/// When true, protects keys using a certificate file (PFX/PKCS#12).
	/// </summary>
	/// <remarks>
	/// <para>
	/// This is the recommended cross-platform key protection strategy for Docker.
	/// When enabled, <see cref="CertificatePath"/> must point to an existing file
	/// containing a private key for encryption/decryption.
	/// </para>
	/// </remarks>
	public bool UseCertificate { get; init; }

	/// <summary>
	/// Filesystem path to a certificate (PFX) file used to encrypt keys.
	/// </summary>
	/// <remarks>
	/// <para>
	/// Required when <see cref="UseCertificate"/> is true.
	/// In development, generate with:
	/// </para>
	/// <code>.\scripts\generate-dataprotection-cert.ps1 -Password "YourPassword"</code>
	/// </remarks>
	public string? CertificatePath { get; init; }

	/// <summary>
	/// Password for the certificate file at <see cref="CertificatePath"/>.
	/// </summary>
	/// <remarks>
	/// Should be stored in User Secrets (Development) or environment variables (Production).
	/// </remarks>
	public string? CertificatePassword { get; init; }

	/// <summary>
	/// When true, allows startup to continue with unprotected keys if certificate
	/// configuration fails. Only applies in Development environment.
	/// </summary>
	/// <remarks>
	/// <para>
	/// In Production, invalid certificate configuration always fails startup.
	/// This option provides developer convenience while maintaining security.
	/// </para>
	/// </remarks>
	public bool AllowUnprotectedKeysInDevelopment { get; init; } = true;
}