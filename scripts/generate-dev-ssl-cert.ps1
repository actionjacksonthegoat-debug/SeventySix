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
# NOTE: Includes localhost and observability service subdomains for nginx-proxy HTTPS.
# The Angular dev server will list all SANs but only localhost addresses are usable locally.
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
			"redisinsight.localhost"
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

function Remove-OldSeventySixCertificates {
	<#
	.SYNOPSIS
	Removes all existing SeventySix development certificates from the Trusted Root store.
	This prevents certificate accumulation and ensures clean state.

	.PARAMETER NewThumbprint
	Optional. The thumbprint of the new certificate to keep (don't remove this one).

	.OUTPUTS
	The count of certificates removed.
	#>
	param(
		[string]$NewThumbprint = ""
	)

	$removedCount = 0

	try {
		# Find ALL localhost self-signed certificates that look like dev certificates
		# These are characterized by:
		# - Subject = CN=localhost
		# - Self-signed (issuer == subject)
		# - Typically have short validity periods (1-5 years)
		$existingCerts = Get-ChildItem -Path "Cert:\LocalMachine\Root" -ErrorAction SilentlyContinue |
		Where-Object {
			# Match SeventySix certificates by name
			$_.Subject -like "*SeventySix*" -or
			$_.FriendlyName -like "*SeventySix*" -or
			# Match any localhost dev certificates (self-signed)
			($_.Subject -eq "CN=localhost" -and $_.Issuer -eq "CN=localhost")
		} |
		Where-Object {
			# Don't remove the new certificate we just generated
			$_.Thumbprint -ne $NewThumbprint
		}

		foreach ($cert in $existingCerts) {
			try {
				$displayName = if ($cert.FriendlyName) { $cert.FriendlyName } else { $cert.Subject }
				Remove-Item -Path "Cert:\LocalMachine\Root\$($cert.Thumbprint)" -Force
				$removedCount++
				Write-Host "  Removed: $($cert.Thumbprint.Substring(0, 8))... ($displayName)" -ForegroundColor Gray
			}
			catch {
				Write-Host "  Failed to remove: $($cert.Thumbprint.Substring(0, 8))..." -ForegroundColor Yellow
			}
		}
	}
	catch {
		# Silently ignore if we can't enumerate (non-admin)
	}

	return $removedCount
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
	Write-Host "This will:" -ForegroundColor White
	Write-Host "  1. Remove any existing SeventySix dev certificates (prevents duplicates)" -ForegroundColor Gray
	Write-Host "  2. Add the new certificate to Trusted Root store" -ForegroundColor Gray
	Write-Host ""
	Write-Host "Certificates to trust:" -ForegroundColor White

	foreach ($certificateInfo in $certificatesToTrust) {
		Write-Host "  - $($certificateInfo.Name): $($certificateInfo.Path)" -ForegroundColor Gray
	}

	Write-Host ""

	$userResponse = Read-Host "Clean up old certs and trust new certificate? (y/n)"

	if ($userResponse -eq 'y' -or $userResponse -eq 'Y') {
		Write-Host ""

		# Get the thumbprint of the new certificate to avoid removing it
		$newCertPath = $certificatesToTrust[0].Path
		$newCert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($newCertPath)
		$newThumbprint = $newCert.Thumbprint
		$newCert.Dispose()

		# Check if running as Administrator
		if (Test-AdministratorPrivileges) {
			Write-Host "Cleaning up old localhost dev certificates..." -ForegroundColor Cyan
			$removedCount = Remove-OldSeventySixCertificates -NewThumbprint $newThumbprint
			if ($removedCount -gt 0) {
				Write-Host "  Removed $removedCount old certificate(s)" -ForegroundColor Green
			}
			else {
				Write-Host "  No old certificates found" -ForegroundColor Gray
			}

			Write-Host ""
			Write-Host "Installing new certificate as trusted root..." -ForegroundColor Cyan

			foreach ($certificateInfo in $certificatesToTrust) {
				Install-TrustedCertificate -CertificatePath $certificateInfo.Path -CertificateName $certificateInfo.Name | Out-Null
			}

			# Verify trust
			Write-Host ""
			Write-Host "Verifying certificate trust..." -ForegroundColor Cyan
			$allTrusted = $true
			foreach ($certificateInfo in $certificatesToTrust) {
				if (Test-CertificateAlreadyTrusted -CertificatePath $certificateInfo.Path) {
					Write-Host "  [OK] $($certificateInfo.Name) is trusted" -ForegroundColor Green
				}
				else {
					Write-Host "  [FAIL] $($certificateInfo.Name) is NOT trusted" -ForegroundColor Red
					$allTrusted = $false
				}
			}

			if ($allTrusted) {
				Write-Host ""
				Write-Host "SUCCESS: Certificate is trusted. Close and reopen your browser to apply." -ForegroundColor Green
			}
		}
		else {
			Write-Host "Administrator privileges required. Elevating..." -ForegroundColor Yellow
			Write-Host ""

			# Build a script block that will run elevated
			$certPaths = ($certificatesToTrust | ForEach-Object { $_.Path }) -join "','"

			$elevatedScript = @"
Write-Host 'Cleaning up old localhost dev certificates...' -ForegroundColor Cyan
`$newThumbprint = '$newThumbprint'
`$removed = 0
Get-ChildItem -Path 'Cert:\LocalMachine\Root' -ErrorAction SilentlyContinue | Where-Object {
    (`$_.Subject -like '*SeventySix*' -or
     `$_.FriendlyName -like '*SeventySix*' -or
     (`$_.Subject -eq 'CN=localhost' -and `$_.Issuer -eq 'CN=localhost')) -and
    `$_.Thumbprint -ne `$newThumbprint
} | ForEach-Object {
    try {
        `$displayName = if (`$_.FriendlyName) { `$_.FriendlyName } else { `$_.Subject }
        Remove-Item -Path "Cert:\LocalMachine\Root\`$(`$_.Thumbprint)" -Force
        `$removed++
        Write-Host "  Removed: `$(`$_.Thumbprint.Substring(0, 8))... (`$displayName)" -ForegroundColor Gray
    } catch { }
}
if (`$removed -gt 0) {
    Write-Host "  Removed `$removed old certificate(s)" -ForegroundColor Green
} else {
    Write-Host '  No old certificates found' -ForegroundColor Gray
}
Write-Host ''
Write-Host 'Installing new certificate...' -ForegroundColor Cyan
@('$certPaths') | ForEach-Object {
    Import-Certificate -FilePath `$_ -CertStoreLocation 'Cert:\LocalMachine\Root' | Out-Null
    Write-Host "  Trusted: `$_" -ForegroundColor Green
}
Write-Host ''
Write-Host 'Done! Close this window and reopen your browser.' -ForegroundColor Green
Write-Host ''
Read-Host 'Press Enter to close'
"@

			try {
				Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoProfile", "-Command", $elevatedScript -Wait

				# Verify trust after elevation
				Start-Sleep -Seconds 1
				Write-Host ""
				Write-Host "Verifying certificate trust..." -ForegroundColor Cyan
				$allTrusted = $true
				foreach ($certificateInfo in $certificatesToTrust) {
					if (Test-CertificateAlreadyTrusted -CertificatePath $certificateInfo.Path) {
						Write-Host "  [OK] $($certificateInfo.Name) is trusted" -ForegroundColor Green
					}
					else {
						Write-Host "  [FAIL] $($certificateInfo.Name) is NOT trusted" -ForegroundColor Red
						$allTrusted = $false
					}
				}

				if ($allTrusted) {
					Write-Host ""
					Write-Host "SUCCESS: Certificate is trusted. Close and reopen your browser to apply." -ForegroundColor Green
				}
			}
			catch {
				Write-Host ""
				Write-Host "Failed to elevate. Please run this command manually as Administrator:" -ForegroundColor Red
				Write-Host "  .\scripts\generate-dev-ssl-cert.ps1 -Force" -ForegroundColor White
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
