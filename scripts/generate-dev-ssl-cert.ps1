# generate-dev-ssl-cert.ps1
# Generates a unified self-signed SSL certificate for local development.
#
# This certificate covers ALL development services:
#   - Angular client (https://localhost:4200)
#   - .NET API (https://localhost:7074)
#   - Grafana (https://localhost:3443 via nginx-proxy)
#   - Jaeger (https://localhost:16687 via nginx-proxy)
#   - Prometheus (https://localhost:9091 via nginx-proxy)
#   - pgAdmin (https://localhost:5051 via nginx-proxy)
#   - OTEL Collector (https://localhost:4319 via nginx-proxy)
#
# ============================================================================
# CERTIFICATE TRUST COMMANDS (Run PowerShell as Administrator)
# ============================================================================
#
# GENERATE CERTIFICATE:
#   .\scripts\generate-dev-ssl-cert.ps1
#   .\scripts\generate-dev-ssl-cert.ps1 -Force  # Regenerate existing
#
# TRUST CERTIFICATE (Required once after generation):
#   Import-Certificate -FilePath "C:\SeventySix\SeventySix.Client\ssl\dev-certificate.crt" -CertStoreLocation Cert:\LocalMachine\Root
#
# VERIFY TRUST:
#   Get-ChildItem Cert:\LocalMachine\Root | Where-Object { $_.Subject -like "*SeventySix*" }
#
# REMOVE TRUST (if needed):
#   Get-ChildItem Cert:\LocalMachine\Root | Where-Object { $_.Subject -like "*SeventySix*" } | Remove-Item
#
# GUI ALTERNATIVE:
#   1. Double-click dev-certificate.crt
#   2. Click "Install Certificate..."
#   3. Select "Local Machine" → Next
#   4. Select "Place all certificates in the following store"
#   5. Browse → "Trusted Root Certification Authorities" → OK
#   6. Next → Finish
#
# ============================================================================
# IMPORTANT: These certificates are for DEVELOPMENT ONLY.
# Production environments MUST use real certificates from a trusted CA.
# ============================================================================

param(
	[string]$OutputDir = "$PSScriptRoot\..\SeventySix.Client\ssl",
	[switch]$Force
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Development SSL Certificate Generator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Resolve the output directory path
$resolvedOutputDir = [System.IO.Path]::GetFullPath($OutputDir)
$certificatePath = Join-Path $resolvedOutputDir "dev-certificate.crt"
$privateKeyPath = Join-Path $resolvedOutputDir "dev-certificate.key"
$pfxBundlePath = Join-Path $resolvedOutputDir "dev-certificate.pfx"

# Create output directory if it doesn't exist
if (-not (Test-Path $resolvedOutputDir)) {
	New-Item -ItemType Directory -Path $resolvedOutputDir -Force | Out-Null
	Write-Host "Created directory: $resolvedOutputDir" -ForegroundColor Gray
}

# Check if certificates already exist
if ((Test-Path $certificatePath) -and -not $Force) {
	Write-Host "Certificate already exists at: $certificatePath" -ForegroundColor Yellow
	Write-Host "Use -Force to regenerate." -ForegroundColor Yellow
	Write-Host ""
	exit 0
}

# Generate self-signed certificate using .NET
Write-Host "Generating SSL certificate for localhost..." -ForegroundColor Cyan

try {
	# Create certificate with Subject Alternative Names for all development services
	# Includes localhost variants and observability service hostnames
	$developmentCertificate = New-SelfSignedCertificate `
		-Subject "CN=localhost" `
		-DnsName "localhost", "127.0.0.1", "::1", "grafana.localhost", "jaeger.localhost", "prometheus.localhost", "pgadmin.localhost" `
		-KeyAlgorithm RSA `
		-KeyLength 2048 `
		-NotBefore (Get-Date) `
		-NotAfter (Get-Date).AddYears(2) `
		-CertStoreLocation "Cert:\CurrentUser\My" `
		-FriendlyName "SeventySix Development Certificate" `
		-HashAlgorithm SHA256 `
		-KeyUsage DigitalSignature, KeyEncipherment `
		-TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1") `
		-KeyExportPolicy Exportable

	Write-Host "Certificate generated with thumbprint: $($developmentCertificate.Thumbprint)" -ForegroundColor Gray

	# Export to PFX (contains both certificate and private key)
	$pfxPassword = ConvertTo-SecureString -String "dev-ssl-password" -Force -AsPlainText
	Export-PfxCertificate `
		-Cert $developmentCertificate `
		-FilePath $pfxBundlePath `
		-Password $pfxPassword | Out-Null

	# Use OpenSSL to extract PEM files from PFX (if available)
	# Check system PATH first, then Git's bundled OpenSSL
	$opensslPath = Get-Command openssl -ErrorAction SilentlyContinue

	if (-not $opensslPath) {
		# Try Git's bundled OpenSSL
		$gitPath = Get-Command git -ErrorAction SilentlyContinue
		if ($gitPath) {
			$gitDir = Split-Path (Split-Path $gitPath.Source)
			$gitOpenssl = Join-Path $gitDir "usr\bin\openssl.exe"
			if (Test-Path $gitOpenssl) {
				$opensslPath = @{ Source = $gitOpenssl }
				Write-Host "Using Git's bundled OpenSSL..." -ForegroundColor Gray
			}
		}
	}

	if ($opensslPath) {
		Write-Host "Extracting PEM files from PFX..." -ForegroundColor Gray
		$opensslExecutable = $opensslPath.Source

		# Extract certificate and convert to clean PEM
		& $opensslExecutable pkcs12 -in $pfxBundlePath -clcerts -nokeys -out $certificatePath -passin pass:dev-ssl-password 2>$null
		& $opensslExecutable x509 -in $certificatePath -out $certificatePath 2>$null

		# Extract private key and convert to clean PEM
		& $opensslExecutable pkcs12 -in $pfxBundlePath -nocerts -nodes -out $privateKeyPath -passin pass:dev-ssl-password 2>$null
		& $opensslExecutable rsa -in $privateKeyPath -out $privateKeyPath 2>$null

		Write-Host ""
		Write-Host "Certificate generated successfully!" -ForegroundColor Green
		Write-Host ""
		Write-Host "Files created:" -ForegroundColor White
		Write-Host "  Certificate: $certificatePath" -ForegroundColor Gray
		Write-Host "  Private Key: $privateKeyPath" -ForegroundColor Gray
		Write-Host "  PFX Bundle:  $pfxBundlePath" -ForegroundColor Gray
	}
	else {
		# Fallback: Export certificate (public key) to CRT format using .NET
		$certificateBytes = $developmentCertificate.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
		$certificateBase64 = [System.Convert]::ToBase64String($certificateBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
		$certificatePem = "-----BEGIN CERTIFICATE-----`n$certificateBase64`n-----END CERTIFICATE-----"
		[System.IO.File]::WriteAllText($certificatePath, $certificatePem)

		Write-Host ""
		Write-Host "Certificate generated (OpenSSL not found for key extraction)." -ForegroundColor Yellow
		Write-Host ""
		Write-Host "Files created:" -ForegroundColor White
		Write-Host "  Certificate: $certificatePath" -ForegroundColor Gray
		Write-Host "  PFX Bundle:  $pfxBundlePath" -ForegroundColor Gray
		Write-Host ""
		Write-Host "To extract the private key, install OpenSSL and run:" -ForegroundColor Yellow
		Write-Host "  openssl pkcs12 -in `"$pfxBundlePath`" -nocerts -nodes -out `"$privateKeyPath`" -passin pass:dev-ssl-password" -ForegroundColor White
		Write-Host ""
		Write-Host "Or install OpenSSL via:" -ForegroundColor Yellow
		Write-Host "  winget install OpenSSL.Light" -ForegroundColor White
		Write-Host "  # or" -ForegroundColor Gray
		Write-Host "  choco install openssl.light" -ForegroundColor White
	}

	# Clean up from certificate store (we have the files now)
	Remove-Item -Path "Cert:\CurrentUser\My\$($developmentCertificate.Thumbprint)" -Force

	Write-Host ""
	Write-Host "To trust this certificate (removes browser warnings):" -ForegroundColor Yellow
	Write-Host "  1. Double-click the .crt file (or .pfx)" -ForegroundColor White
	Write-Host "  2. Click 'Install Certificate...'" -ForegroundColor White
	Write-Host "  3. Select 'Local Machine' and click Next" -ForegroundColor White
	Write-Host "  4. Select 'Place all certificates in the following store'" -ForegroundColor White
	Write-Host "  5. Click Browse and select 'Trusted Root Certification Authorities'" -ForegroundColor White
	Write-Host "  6. Click Next, then Finish" -ForegroundColor White
	Write-Host ""
	Write-Host "Or run this PowerShell command as Administrator:" -ForegroundColor Yellow
	Write-Host "  Import-Certificate -FilePath `"$certificatePath`" -CertStoreLocation Cert:\LocalMachine\Root" -ForegroundColor White
	Write-Host ""
}
catch {
	Write-Host "Failed to generate certificate: $_" -ForegroundColor Red
	exit 1
}
