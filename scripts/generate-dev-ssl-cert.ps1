# generate-dev-ssl-cert.ps1
# Generates a unified self-signed SSL certificate for local development and E2E testing.
#
# SINGLE CERTIFICATE COVERS ALL ENVIRONMENTS:
# ============================================================================
#
# Location: SeventySix.Client\ssl\
#
# Development:
#   - Angular client (https://localhost:4200)
#   - .NET API (https://localhost:7074)
#   - Observability services (Grafana, Jaeger, Prometheus, pgAdmin, OTEL)
#
# E2E Testing (Docker):
#   - Angular client (https://localhost:4201)
#   - .NET API (https://localhost:7174)
#   - Both containers mount the same certificate directory
#
# ============================================================================
# USAGE
# ============================================================================
#
#   .\scripts\generate-dev-ssl-cert.ps1           # Generate if missing
#   .\scripts\generate-dev-ssl-cert.ps1 -Force    # Regenerate certificate
#   .\scripts\generate-dev-ssl-cert.ps1 -SkipTrust # Skip trust prompt
#
# ============================================================================
# MANUAL TRUST COMMANDS (if automated trust fails)
# ============================================================================
#
# TRUST CERTIFICATE (Run PowerShell as Administrator):
#   Import-Certificate -FilePath "C:\SeventySix\SeventySix.Client\ssl\dev-certificate.crt" -CertStoreLocation Cert:\LocalMachine\Root
#
# VERIFY TRUST:
#   Get-ChildItem Cert:\LocalMachine\Root | Where-Object { $_.Subject -like "*SeventySix*" }
#
# REMOVE TRUST (if needed):
#   Get-ChildItem Cert:\LocalMachine\Root | Where-Object { $_.Subject -like "*SeventySix*" } | Remove-Item
#
# ============================================================================
# IMPORTANT: These certificates are for DEVELOPMENT AND E2E TESTING ONLY.
# Production environments MUST use real certificates from a trusted CA.
# ============================================================================

param(
	[switch]$Force,
	[switch]$SkipTrust
)

# ============================================================================
# CONFIGURATION
# ============================================================================

$scriptRootDirectory = $PSScriptRoot
$projectRootDirectory = [System.IO.Path]::GetFullPath("$scriptRootDirectory\..")

# Single certificate configuration (used for both dev and E2E)
$certificateConfigurations = @(
	@{
		Name            = "Development & E2E"
		OutputDirectory = "$projectRootDirectory\SeventySix.Client\ssl"
		CertificateName = "dev-certificate"
		FriendlyName    = "SeventySix Development Certificate"
		Password        = "dev-ssl-password"
		DnsNames        = @(
			"localhost",
			"127.0.0.1",
			"::1",
			"grafana.localhost",
			"jaeger.localhost",
			"prometheus.localhost",
			"pgadmin.localhost",
			"api-e2e",       # Docker service name for internal E2E communication
			"client-e2e"     # Docker service name for internal E2E communication
		)
	}
)

# ============================================================================
# FUNCTIONS
# ============================================================================

function Find-OpenSslExecutable {
	<#
	.SYNOPSIS
	Locates the OpenSSL executable from PATH or Git installation.

	.OUTPUTS
	The path to the OpenSSL executable, or $null if not found.
	#>

	$opensslCommand = Get-Command openssl -ErrorAction SilentlyContinue

	if ($opensslCommand) {
		return $opensslCommand.Source
	}

	# Try Git's bundled OpenSSL as fallback
	$gitCommand = Get-Command git -ErrorAction SilentlyContinue

	if ($gitCommand) {
		$gitDirectory = Split-Path (Split-Path $gitCommand.Source)
		$gitOpenSslPath = Join-Path $gitDirectory "usr\bin\openssl.exe"

		if (Test-Path $gitOpenSslPath) {
			Write-Host "  Using Git's bundled OpenSSL" -ForegroundColor Gray
			return $gitOpenSslPath
		}
	}

	return $null
}

function Test-CertificateExists {
	<#
	.SYNOPSIS
	Checks if a certificate already exists at the specified location.

	.PARAMETER OutputDirectory
	The directory to check for certificate files.

	.PARAMETER CertificateName
	The base name of the certificate files (without extension).

	.OUTPUTS
	$true if the certificate exists, $false otherwise.
	#>
	param(
		[string]$OutputDirectory,
		[string]$CertificateName
	)

	$pfxPath = Join-Path $OutputDirectory "$CertificateName.pfx"
	return Test-Path $pfxPath
}

function Test-CertificateAlreadyTrusted {
	<#
	.SYNOPSIS
	Checks if a certificate is already trusted in the Windows certificate store.

	.PARAMETER CertificatePath
	The path to the certificate file to check.

	.OUTPUTS
	$true if the certificate is already trusted, $false otherwise.
	#>
	param(
		[string]$CertificatePath
	)

	if (-not (Test-Path $CertificatePath)) {
		return $false
	}

	try {
		$certificateToCheck = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($CertificatePath)
		$thumbprint = $certificateToCheck.Thumbprint
		$certificateToCheck.Dispose()

		$trustedCertificate = Get-ChildItem -Path "Cert:\LocalMachine\Root" -ErrorAction SilentlyContinue |
		Where-Object { $_.Thumbprint -eq $thumbprint }

		return $null -ne $trustedCertificate
	}
	catch {
		return $false
	}
}

function New-SslCertificateFiles {
	<#
	.SYNOPSIS
	Generates SSL certificate files for a given configuration.

	.PARAMETER Configuration
	A hashtable containing certificate configuration (Name, OutputDirectory, CertificateName, FriendlyName, Password, DnsNames).

	.OUTPUTS
	The path to the generated certificate (.crt) file, or $null on failure.
	#>
	param(
		[hashtable]$Configuration
	)

	$environmentName = $Configuration.Name
	$outputDirectory = $Configuration.OutputDirectory
	$certificateName = $Configuration.CertificateName
	$friendlyName = $Configuration.FriendlyName
	$pfxPassword = $Configuration.Password
	$dnsNames = $Configuration.DnsNames

	$certificatePath = Join-Path $outputDirectory "$certificateName.crt"
	$privateKeyPath = Join-Path $outputDirectory "$certificateName.key"
	$pfxBundlePath = Join-Path $outputDirectory "$certificateName.pfx"

	Write-Host ""
	Write-Host "Generating $environmentName certificate..." -ForegroundColor Cyan

	# Create output directory if it doesn't exist
	if (-not (Test-Path $outputDirectory)) {
		New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
		Write-Host "  Created directory: $outputDirectory" -ForegroundColor Gray
	}

	try {
		# Create certificate with Subject Alternative Names
		$generatedCertificate = New-SelfSignedCertificate `
			-Subject "CN=localhost" `
			-DnsName $dnsNames `
			-KeyAlgorithm RSA `
			-KeyLength 2048 `
			-NotBefore (Get-Date) `
			-NotAfter (Get-Date).AddYears(2) `
			-CertStoreLocation "Cert:\CurrentUser\My" `
			-FriendlyName $friendlyName `
			-HashAlgorithm SHA256 `
			-KeyUsage DigitalSignature, KeyEncipherment `
			-TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1") `
			-KeyExportPolicy Exportable

		Write-Host "  Thumbprint: $($generatedCertificate.Thumbprint)" -ForegroundColor Gray

		# Export to PFX (contains both certificate and private key)
		$securePassword = ConvertTo-SecureString -String $pfxPassword -Force -AsPlainText
		Export-PfxCertificate `
			-Cert $generatedCertificate `
			-FilePath $pfxBundlePath `
			-Password $securePassword | Out-Null

		# Extract PEM files using OpenSSL if available
		$opensslExecutable = Find-OpenSslExecutable

		if ($opensslExecutable) {
			# Extract certificate to PEM format
			& $opensslExecutable pkcs12 -in $pfxBundlePath -clcerts -nokeys -out $certificatePath -passin "pass:$pfxPassword" 2>$null
			& $opensslExecutable x509 -in $certificatePath -out $certificatePath 2>$null

			# Extract private key to PEM format
			& $opensslExecutable pkcs12 -in $pfxBundlePath -nocerts -nodes -out $privateKeyPath -passin "pass:$pfxPassword" 2>$null
			& $opensslExecutable rsa -in $privateKeyPath -out $privateKeyPath 2>$null

			Write-Host "  Created: $certificateName.crt, $certificateName.key, $certificateName.pfx" -ForegroundColor Green
		}
		else {
			# Fallback: Export certificate (public key) to CRT format using .NET
			$certificateBytes = $generatedCertificate.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
			$certificateBase64 = [System.Convert]::ToBase64String($certificateBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
			$certificatePem = "-----BEGIN CERTIFICATE-----`n$certificateBase64`n-----END CERTIFICATE-----"
			[System.IO.File]::WriteAllText($certificatePath, $certificatePem)

			Write-Host "  Created: $certificateName.crt, $certificateName.pfx (no .key - OpenSSL not found)" -ForegroundColor Yellow
		}

		# Clean up from certificate store (we have the files now)
		Remove-Item -Path "Cert:\CurrentUser\My\$($generatedCertificate.Thumbprint)" -Force

		return $certificatePath
	}
	catch {
		Write-Host "  Failed: $_" -ForegroundColor Red
		return $null
	}
}

function Install-TrustedCertificate {
	<#
	.SYNOPSIS
	Installs a certificate into the Windows Trusted Root Certification Authorities store.

	.PARAMETER CertificatePath
	The path to the certificate file to trust.

	.PARAMETER CertificateName
	A friendly name for display purposes.

	.OUTPUTS
	$true if successful, $false otherwise.
	#>
	param(
		[string]$CertificatePath,
		[string]$CertificateName
	)

	if (-not (Test-Path $CertificatePath)) {
		Write-Host "  Certificate not found: $CertificatePath" -ForegroundColor Red
		return $false
	}

	try {
		Import-Certificate -FilePath $CertificatePath -CertStoreLocation "Cert:\LocalMachine\Root" | Out-Null
		Write-Host "  Trusted: $CertificateName" -ForegroundColor Green
		return $true
	}
	catch {
		Write-Host "  Failed to trust $CertificateName : $_" -ForegroundColor Red
		return $false
	}
}

function Test-AdministratorPrivileges {
	<#
	.SYNOPSIS
	Checks if the current PowerShell session is running with Administrator privileges.

	.OUTPUTS
	$true if running as Administrator, $false otherwise.
	#>
	$currentIdentity = [Security.Principal.WindowsIdentity]::GetCurrent()
	$currentPrincipal = New-Object Security.Principal.WindowsPrincipal($currentIdentity)
	return $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# ============================================================================
# MAIN SCRIPT
# ============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SSL Certificate Generator" -ForegroundColor Cyan
Write-Host "  (Development + E2E Testing)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Track generated certificates for trust step
$generatedCertificatePaths = @()
$certificatesGenerated = $false
$certificatesSkipped = 0

foreach ($configuration in $certificateConfigurations) {
	$environmentName = $configuration.Name
	$outputDirectory = $configuration.OutputDirectory
	$certificateName = $configuration.CertificateName

	# Check if certificate already exists
	if ((Test-CertificateExists -OutputDirectory $outputDirectory -CertificateName $certificateName) -and -not $Force) {
		$existingPfxPath = Join-Path $outputDirectory "$certificateName.pfx"
		Write-Host ""
		Write-Host "$environmentName certificate already exists" -ForegroundColor Yellow
		Write-Host "  Location: $existingPfxPath" -ForegroundColor Gray

		# Still track for trust verification
		$existingCrtPath = Join-Path $outputDirectory "$certificateName.crt"
		if (Test-Path $existingCrtPath) {
			$generatedCertificatePaths += @{
				Path = $existingCrtPath
				Name = $environmentName
			}
		}

		$certificatesSkipped++
		continue
	}

	# Generate the certificate
	$certificatePath = New-SslCertificateFiles -Configuration $configuration

	if ($certificatePath) {
		$generatedCertificatePaths += @{
			Path = $certificatePath
			Name = $environmentName
		}
		$certificatesGenerated = $true
	}
}

# ============================================================================
# CERTIFICATE TRUST
# ============================================================================

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray

# Check which certificates need to be trusted
$certificatesToTrust = @()

foreach ($certificateInfo in $generatedCertificatePaths) {
	if (-not (Test-CertificateAlreadyTrusted -CertificatePath $certificateInfo.Path)) {
		$certificatesToTrust += $certificateInfo
	}
	else {
		Write-Host "$($certificateInfo.Name) certificate is already trusted" -ForegroundColor Green
	}
}

if ($certificatesToTrust.Count -eq 0) {
	Write-Host ""
	Write-Host "All certificates are already trusted." -ForegroundColor Green
}
elseif ($SkipTrust) {
	Write-Host ""
	Write-Host "Trust step skipped (-SkipTrust flag)" -ForegroundColor Yellow
	Write-Host ""
	Write-Host "To trust certificates manually, run as Administrator:" -ForegroundColor Yellow

	foreach ($certificateInfo in $certificatesToTrust) {
		Write-Host "  Import-Certificate -FilePath `"$($certificateInfo.Path)`" -CertStoreLocation Cert:\LocalMachine\Root" -ForegroundColor White
	}
}
else {
	# Prompt user to trust certificates
	Write-Host ""
	Write-Host "CERTIFICATE TRUST" -ForegroundColor Cyan
	Write-Host ""
	Write-Host "To eliminate browser security warnings, certificates must be added to" -ForegroundColor White
	Write-Host "the Windows Trusted Root Certification Authorities store." -ForegroundColor White
	Write-Host ""
	Write-Host "Certificates to trust:" -ForegroundColor White

	foreach ($certificateInfo in $certificatesToTrust) {
		Write-Host "  - $($certificateInfo.Name): $($certificateInfo.Path)" -ForegroundColor Gray
	}

	Write-Host ""

	$userResponse = Read-Host "Add these certificates to Trusted Root store? (y/n)"

	if ($userResponse -eq 'y' -or $userResponse -eq 'Y') {
		Write-Host ""

		# Check if running as Administrator
		if (Test-AdministratorPrivileges) {
			Write-Host "Installing certificates as trusted roots..." -ForegroundColor Cyan

			foreach ($certificateInfo in $certificatesToTrust) {
				Install-TrustedCertificate -CertificatePath $certificateInfo.Path -CertificateName $certificateInfo.Name | Out-Null
			}
		}
		else {
			Write-Host "Administrator privileges required to trust certificates." -ForegroundColor Yellow
			Write-Host "Attempting to elevate..." -ForegroundColor Gray

			# Build the commands to run elevated
			$trustCommands = $certificatesToTrust | ForEach-Object {
				"Import-Certificate -FilePath '$($_.Path)' -CertStoreLocation 'Cert:\LocalMachine\Root'"
			}

			$elevatedScript = $trustCommands -join "; "

			try {
				Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoProfile", "-Command", $elevatedScript -Wait
				Write-Host ""
				Write-Host "Certificate trust completed (check elevated window for any errors)." -ForegroundColor Green
			}
			catch {
				Write-Host ""
				Write-Host "Failed to elevate. Please run these commands manually as Administrator:" -ForegroundColor Red

				foreach ($certificateInfo in $certificatesToTrust) {
					Write-Host "  Import-Certificate -FilePath `"$($certificateInfo.Path)`" -CertStoreLocation Cert:\LocalMachine\Root" -ForegroundColor White
				}
			}
		}
	}
	else {
		Write-Host ""
		Write-Host "Trust skipped. To trust later, run as Administrator:" -ForegroundColor Yellow

		foreach ($certificateInfo in $certificatesToTrust) {
			Write-Host "  Import-Certificate -FilePath `"$($certificateInfo.Path)`" -CertStoreLocation Cert:\LocalMachine\Root" -ForegroundColor White
		}
	}
}

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($certificatesGenerated) {
	Write-Host "Certificates generated successfully!" -ForegroundColor Green
}
elseif ($certificatesSkipped -eq $certificateConfigurations.Count) {
	Write-Host "All certificates already exist." -ForegroundColor Green
	Write-Host "Use -Force to regenerate." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Locations:" -ForegroundColor White

foreach ($configuration in $certificateConfigurations) {
	$pfxPath = Join-Path $configuration.OutputDirectory "$($configuration.CertificateName).pfx"
	Write-Host "  $($configuration.Name): $pfxPath" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  - Development: Run 'npm start' or 'dotnet run'" -ForegroundColor Gray
Write-Host "  - E2E Tests:   Run 'npm run test:e2e'" -ForegroundColor Gray
Write-Host ""
