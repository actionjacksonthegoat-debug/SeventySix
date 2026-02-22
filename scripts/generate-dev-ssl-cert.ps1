#Requires -Version 7.4
# generate-dev-ssl-cert.ps1
# Generates a unified self-signed SSL certificate for local development and E2E testing.
# Cross-platform: uses openssl (Windows via Git, Linux natively, GitHub Actions runners).
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

	$opensslExecutable = Find-OpenSslExecutable
	if (-not $opensslExecutable) {
		Write-Host "  [ERROR] openssl not found. Install Git for Windows (includes openssl) or install openssl directly." -ForegroundColor Red
		return $null
	}

	try {
		# Build SAN config file
		$tmpConf = [System.IO.Path]::GetTempFileName() + ".cnf"
		$sanList = ($dnsNames | Where-Object { $_ -notmatch '^[\d:]+$' } | ForEach-Object -Begin { $i = 1 } -Process { "DNS.$i = $_"; $i++ }) -join "`n"
		$ipList = ($dnsNames | Where-Object { $_ -match '^[\d.:]+$' } | ForEach-Object -Begin { $i = 1 } -Process { "IP.$i = $_"; $i++ }) -join "`n"
		$confContent = @"
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = localhost

[v3_req]
subjectAltName = @alt_names

[alt_names]
$sanList
$ipList
"@
		[System.IO.File]::WriteAllText($tmpConf, $confContent)

		# Generate key + cert
		& $opensslExecutable req -x509 -nodes -days 730 -newkey rsa:2048 `
			-keyout $privateKeyPath -out $certificatePath `
			-config $tmpConf 2>$null

		if ($LASTEXITCODE -ne 0) { throw "openssl req failed" }

		# Bundle into PFX
		# -name sets the certificate's FriendlyName inside the PFX, enabling
		# the SeventySix-specific match in Remove-OldSeventySixCertificates.
		& $opensslExecutable pkcs12 -export `
			-out $pfxBundlePath `
			-inkey $privateKeyPath -in $certificatePath `
			-passout "pass:$pfxPassword" `
			-name "$friendlyName" 2>$null

		if ($LASTEXITCODE -ne 0) { throw "openssl pkcs12 export failed" }

		Write-Host "  Created: $certificateName.crt, $certificateName.key, $certificateName.pfx" -ForegroundColor Green

		# Ensure files are readable by all users on Linux (required for Docker volume mounts)
		# On Windows this is not needed — PowerShell handles permissions differently.
		if (-not $IsWindows) {
			chmod 644 $certificatePath $privateKeyPath $pfxBundlePath 2>$null
			Write-Host "  Permissions set (644): $certificateName.*" -ForegroundColor Gray
		}

		return $certificatePath
	}
	catch {
		Write-Host "  Failed: $_" -ForegroundColor Red
		return $null
	}
	finally {
		Remove-Item -Path $tmpConf -Force -ErrorAction SilentlyContinue
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
	# Windows-only: checks if session has Administrator privileges for cert store operations
	if (-not $IsWindows) { return $false }
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

			# Fix permissions for existing certs on Linux (may have been generated with 600)
			if (-not $IsWindows) {
				$existingKeyPath = Join-Path $outputDirectory "$certificateName.key"
				$existingPfxPath2 = Join-Path $outputDirectory "$certificateName.pfx"
				chmod 644 $existingCrtPath $existingKeyPath $existingPfxPath2 2>$null
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
# CERTIFICATE TRUST (Windows only — Linux uses system trust or browser flags)
# ============================================================================

if ($IsWindows -and -not $SkipTrust) {

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
}
elseif ($SkipTrust -and $IsWindows) {
	Write-Host ""
	Write-Host "Trust step skipped (-SkipTrust flag)" -ForegroundColor Yellow
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
