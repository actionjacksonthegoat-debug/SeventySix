# generate-dataprotection-cert.ps1
# Generates a self-signed certificate for Data Protection key encryption.
#
# Cross-platform: uses openssl (available on Windows via Git, Linux natively,
# and GitHub Actions ubuntu-latest runners).
#
# This certificate is used to encrypt ASP.NET Core Data Protection keys at rest,
# enabling cross-platform key protection in Docker containers.
#
# Usage:
#   .\scripts\generate-dataprotection-cert.ps1
#   .\scripts\generate-dataprotection-cert.ps1 -Password "YourSecurePassword"
#   .\scripts\generate-dataprotection-cert.ps1 -OutputPath ".\custom\path\cert.pfx"
#   .\scripts\generate-dataprotection-cert.ps1 -Force    # Regenerate even if cert already exists

#Requires -Version 7.4
[CmdletBinding()]
param(
	[Parameter(ValueFromPipelineByPropertyName = $true)]
	[object]$Password = $null,
	[string]$OutputPath = ".\SeventySix.Server\SeventySix.Api\keys\dataprotection.pfx",
	[int]$ValidityYears = 5,
	[switch]$Force
)
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Data Protection Certificate Generator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Resolve password (SecureString, plain string, or env vars)
if ($Password -is [System.Security.SecureString]) {
	$plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
		[Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password))
}
elseif ($Password -is [string] -and $Password.Length -gt 0) {
	$plainPassword = $Password
}
elseif ($env:DATA_PROTECTION_CERTIFICATE_PASSWORD) {
	$plainPassword = $env:DATA_PROTECTION_CERTIFICATE_PASSWORD
}
else {
	Write-Host "[ERROR] No password provided. Use -Password parameter or set DATA_PROTECTION_CERTIFICATE_PASSWORD env var." -ForegroundColor Red
	exit 1
}

# Locate openssl
function Find-OpenSsl {
	$cmd = Get-Command openssl -ErrorAction SilentlyContinue
	if ($cmd) { return $cmd.Source }

	# Windows fallback: Git's bundled openssl
	$git = Get-Command git -ErrorAction SilentlyContinue
	if ($git) {
		$gitOpenSsl = Join-Path (Split-Path (Split-Path $git.Source)) "usr\bin\openssl.exe"
		if (Test-Path $gitOpenSsl) { return $gitOpenSsl }
	}

	return $null
}

$openssl = Find-OpenSsl
if (-not $openssl) {
	Write-Host "[ERROR] openssl not found. Install Git for Windows (includes openssl) or install openssl directly." -ForegroundColor Red
	exit 1
}

# Resolve to absolute path
$resolvedOutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
$outputDirectory = Split-Path -Parent $resolvedOutputPath

if (-not (Test-Path $outputDirectory)) {
	New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
	Write-Host "Created directory: $outputDirectory" -ForegroundColor Green
}

# Check if certificate already exists — skip silently unless -Force was passed
if (Test-Path $resolvedOutputPath) {
	if (-not $Force) {
		Write-Host "  [OK] Data Protection certificate already exists — skipping." -ForegroundColor Green
		Write-Host "       Use -Force to regenerate: pwsh scripts/generate-dataprotection-cert.ps1 -Force" -ForegroundColor Gray
		exit 0
	}
	Write-Host "  [WARN] Overwriting existing certificate (-Force specified)." -ForegroundColor Yellow
}

# Temp files for intermediate key/cert
$tmpKey = [System.IO.Path]::ChangeExtension($resolvedOutputPath, ".key")
$tmpCrt = [System.IO.Path]::ChangeExtension($resolvedOutputPath, ".crt")
$validityDays = $ValidityYears * 365

Write-Host "Generating certificate..." -ForegroundColor Cyan

try {
	# Generate private key + self-signed cert
	& $openssl req -x509 -nodes -days $validityDays -newkey rsa:2048 `
		-keyout $tmpKey -out $tmpCrt `
		-subj "/CN=SeventySix-DataProtection" 2>$null

	if ($LASTEXITCODE -ne 0) { throw "openssl req failed" }

	# Export to PFX with password
	& $openssl pkcs12 -export `
		-out $resolvedOutputPath `
		-inkey $tmpKey -in $tmpCrt `
		-passout "pass:$plainPassword" 2>$null

	if ($LASTEXITCODE -ne 0) { throw "openssl pkcs12 export failed" }

	# Read thumbprint for display
	$thumbprintOutput = & $openssl x509 -in $tmpCrt -fingerprint -sha1 -noout 2>$null
	$thumbprint = ($thumbprintOutput -replace "^.*=", "") -replace ":", ""

	Write-Host ""
	Write-Host "Certificate generated successfully!" -ForegroundColor Green
	Write-Host ""
	Write-Host "  Path:      $resolvedOutputPath" -ForegroundColor White
	Write-Host "  Thumbprint: $thumbprint" -ForegroundColor White
	$expiryDate = (Get-Date).AddYears($ValidityYears).ToString("yyyy-MM-dd")
	Write-Host "  Expires:   $expiryDate" -ForegroundColor White
	Write-Host ""
	Write-Host "NOTE: The path above is the local file path." -ForegroundColor Cyan
	Write-Host "      The keys directory is volume-mounted into the container." -ForegroundColor Cyan
	Write-Host ""

	# Ensure the container (runs as non-root) can read the cert
	if (-not $IsWindows) {
		chmod 644 $resolvedOutputPath 2>$null
	}
}
finally {
	# Always clean up temp files
	Remove-Item -Path $tmpKey -Force -ErrorAction SilentlyContinue
	Remove-Item -Path $tmpCrt -Force -ErrorAction SilentlyContinue
}
