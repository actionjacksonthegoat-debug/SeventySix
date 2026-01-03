namespace SeventySix.Api.Configuration;

/// <summary>
/// Options for configuring ASP.NET Core Data Protection key storage and encryption.
/// </summary>
public record AppDataProtectionOptions
{
	/// <summary>
	/// When true, the application should use a certificate file (PFX) to
	/// protect the data protection keys. If enabled, <see cref="CertificatePath"/>
	/// must point to an existing file and <see cref="CertificatePassword"/>
	/// may be required to load the certificate.
	/// </summary>
	public bool UseCertificatePath { get; init; } = false;

	/// <summary>
	/// Filesystem path to a certificate (PFX) file used to encrypt keys.
	/// Required when <see cref="UseCertificatePath"/> is true.
	/// </summary>
	public string? CertificatePath { get; init; }

	/// <summary>
	/// Optional password for the certificate file at <see cref="CertificatePath"/>.
	/// </summary>
	public string? CertificatePassword { get; init; }

	/// <summary>
	/// When true, the application should protect keys using an external
	/// Key Vault service instead of local certificates or DPAPI.
	/// </summary>
	public bool UseAzureKeyVault { get; init; } = false;

	/// <summary>
	/// The URL of the Azure Key Vault to use when <see cref="UseAzureKeyVault"/> is true.
	/// </summary>
	public string? KeyVaultUrl { get; init; }
}
