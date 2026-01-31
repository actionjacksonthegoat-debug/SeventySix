# generate-dataprotection-cert.ps1
# Generates a self-signed certificate for Data Protection key encryption.
#
# This certificate is used to encrypt ASP.NET Core Data Protection keys at rest,
# enabling cross-platform key protection in Docker containers.
#
# Usage:
#   .\scripts\generate-dataprotection-cert.ps1
#   .\scripts\generate-dataprotection-cert.ps1 -Password "YourSecurePassword"
#   .\scripts\generate-dataprotection-cert.ps1 -OutputPath ".\custom\path\cert.pfx"
#
# Examples:
#   Pass plaintext password (not recommended for production):
#     .\scripts\generate-dataprotection-cert.ps1 -Password "DevelopmentPassword123!"
#
#   Pass a SecureString:
#     $secure = ConvertTo-SecureString "YourPassword" -AsPlainText -Force
#     .\scripts\generate-dataprotection-cert.ps1 -Password $secure
#
#   Use a machine-encrypted secure string from .env:
#     $encrypted = (ConvertTo-SecureString "YourPassword" -AsPlainText -Force | ConvertFrom-SecureString)
#     # Add $encrypted to .env as DATA_PROTECTION_CERTIFICATE_PASSWORD_SECURE=<encrypted string>
#     .\scripts\generate-dataprotection-cert.ps1

param(
	[Parameter(ValueFromPipelineByPropertyName = $true)]
	[object]$Password = $null,
	[string]$OutputPath = ".\SeventySix.Server\SeventySix.Api\keys\dataprotection.pfx",
	[int]$ValidityYears = 5
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Data Protection Certificate Generator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Resolve to absolute path
$resolvedOutputPath =
$ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)

# Ensure output directory exists
$outputDirectory =
Split-Path -Parent $resolvedOutputPath

if (-not (Test-Path $outputDirectory))
{
	New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
	Write-Host "Created directory: $outputDirectory" -ForegroundColor Green
}

# Check if certificate already exists
if (Test-Path $resolvedOutputPath)
{
	Write-Host "Certificate already exists at: $resolvedOutputPath" -ForegroundColor Yellow
	$overwriteResponse =
	Read-Host "Overwrite? (y/n)"

	if ($overwriteResponse -ne "y")
	{
		Write-Host "Aborted." -ForegroundColor Yellow
		exit 0
	}
}

# Generate self-signed certificate
Write-Host "Generating certificate..." -ForegroundColor Cyan

$generatedCertificate =
New-SelfSignedCertificate `
	-Subject "CN=SeventySix-DataProtection" `
	-FriendlyName "SeventySix Data Protection Key Encryption" `
	-KeyAlgorithm RSA `
	-KeyLength 2048 `
	-KeyUsage KeyEncipherment, DataEncipherment `
	-KeyExportPolicy Exportable `
	-NotAfter (Get-Date).AddYears($ValidityYears) `
	-CertStoreLocation "Cert:\CurrentUser\My"

# Resolve password to a SecureString (accepts SecureString, plain string, or env vars)
if ($Password -is [System.Security.SecureString])
{
	$securePassword = $Password
}
elseif ($Password -is [string] -and $Password.Length -gt 0)
{
	$securePassword = ConvertTo-SecureString -String $Password -Force -AsPlainText
}
elseif ($env:DATA_PROTECTION_CERTIFICATE_PASSWORD_SECURE)
{
	try
	{
		$securePassword = ConvertTo-SecureString -String $env:DATA_PROTECTION_CERTIFICATE_PASSWORD_SECURE
	}
	catch
	{
		Write-Host "Failed to parse DATA_PROTECTION_CERTIFICATE_PASSWORD_SECURE from environment." -ForegroundColor Yellow
		$securePassword = $null
	}
}
elseif ($env:DATA_PROTECTION_CERTIFICATE_PASSWORD)
{
	$securePassword = ConvertTo-SecureString -String $env:DATA_PROTECTION_CERTIFICATE_PASSWORD -Force -AsPlainText
}
else
{
	# Fallback default (development)
	$securePassword = ConvertTo-SecureString -String "DevCertPassword123!" -Force -AsPlainText
}

Export-PfxCertificate `
	-Cert $generatedCertificate `
	-FilePath $resolvedOutputPath `
	-Password $securePassword | Out-Null

# Clean up from certificate store (we only need the file)
Remove-Item -Path "Cert:\CurrentUser\My\$($generatedCertificate.Thumbprint)" -Force

Write-Host ""
Write-Host "Certificate generated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "  Path: $resolvedOutputPath" -ForegroundColor White
Write-Host "  Thumbprint: $($generatedCertificate.Thumbprint)" -ForegroundColor White
Write-Host "  Expires: $($generatedCertificate.NotAfter.ToString('yyyy-MM-dd'))" -ForegroundColor White
Write-Host ""
# Offer both plaintext and machine-encrypted secure string examples for .env
$encryptedString = ConvertFrom-SecureString -SecureString $securePassword
Write-Host "Add to your .env file (option 1 - plaintext):" -ForegroundColor Yellow
Write-Host "  DATA_PROTECTION_USE_CERTIFICATE=true" -ForegroundColor White
Write-Host "  DATA_PROTECTION_CERTIFICATE_PATH=/app/keys/dataprotection.pfx" -ForegroundColor White
Write-Host "  DATA_PROTECTION_CERTIFICATE_PASSWORD=YourPlaintextPasswordHere" -ForegroundColor White
Write-Host ""
Write-Host "Or (option 2 - machine-encrypted secure string):" -ForegroundColor Yellow
Write-Host "  DATA_PROTECTION_CERTIFICATE_PASSWORD_SECURE=$encryptedString" -ForegroundColor White
Write-Host "  # NOTE: Encrypted string is machine/user protected and can only be decrypted on this account/machine." -ForegroundColor Cyan
Write-Host ""
Write-Host "NOTE: The path above is the Docker container path." -ForegroundColor Cyan
Write-Host "      The keys directory is volume-mounted into the container." -ForegroundColor Cyan
Write-Host ""
