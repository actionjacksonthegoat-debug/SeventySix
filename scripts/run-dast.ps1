<#
.SYNOPSIS
    Run OWASP ZAP DAST scan against a local DAST Docker environment.

.DESCRIPTION
    Starts the DAST Docker Compose environment, runs a ZAP baseline scan,
    and outputs an HTML report to dast-reports/.

.EXAMPLE
    scripts/run-dast.ps1
#>

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot

try {
	# Ensure SSL certificates exist
	$certPath = Join-Path $repoRoot 'SeventySix.Client' 'ssl' 'dev-certificate.crt'
	if (-not (Test-Path $certPath)) {
		Write-Host 'SSL certificates not found. Generating...' -ForegroundColor Yellow
		& pwsh -File (Join-Path $repoRoot 'scripts' 'generate-dev-ssl-cert.ps1')
	}

	# Create output directory
	$reportDir = Join-Path $repoRoot 'dast-reports'
	if (-not (Test-Path $reportDir)) {
		New-Item -ItemType Directory -Path $reportDir | Out-Null
	}

	# Start DAST infrastructure
	Write-Host 'Starting DAST infrastructure...' -ForegroundColor Cyan
	docker compose -f docker-compose.dast.yml up -d --build

	# Wait for API health
	Write-Host 'Waiting for API to be healthy...' -ForegroundColor Cyan
	$maxRetries = 60
	$healthy = $false
	for ($i = 1; $i -le $maxRetries; $i++) {
		try {
			$response = Invoke-WebRequest -Uri 'https://localhost:7274/health' -SkipCertificateCheck -TimeoutSec 3 -ErrorAction SilentlyContinue
			if ($response.StatusCode -eq 200) {
				Write-Host 'API is healthy' -ForegroundColor Green
				$healthy = $true
				break
			}
		}
		catch {
			# Expected while API is starting
		}
		Start-Sleep -Seconds 5
	}

	if (-not $healthy) {
		Write-Error 'API did not become healthy within timeout'
	}

	# Wait for client
	Write-Host 'Waiting for client to be ready...' -ForegroundColor Cyan
	for ($i = 1; $i -le 30; $i++) {
		try {
			$response = Invoke-WebRequest -Uri 'https://localhost:4301/' -SkipCertificateCheck -TimeoutSec 3 -ErrorAction SilentlyContinue
			if ($response.StatusCode -eq 200) {
				Write-Host 'Client is ready' -ForegroundColor Green
				break
			}
		}
		catch {
			# Expected while client is starting
		}
		Start-Sleep -Seconds 3
	}

	# Authenticate and get JWT token
	Write-Host 'Authenticating for DAST scanning...' -ForegroundColor Cyan
	$zapAuthToken = ''
	try {
		$loginBody = @{
			usernameOrEmail = 'admin@seventysix.local'
			password        = 'SecureE2ETestPassword123!'
		} | ConvertTo-Json

		$authResponse = Invoke-RestMethod -Uri 'https://localhost:7274/api/v1/auth/login' `
			-Method Post `
			-ContentType 'application/json' `
			-Body $loginBody `
			-SkipCertificateCheck

		if ($authResponse.accessToken) {
			$zapAuthToken = $authResponse.accessToken
			Write-Host 'Auth token obtained successfully' -ForegroundColor Green
		}
		else {
			Write-Warning 'Login succeeded but no access token returned — running unauthenticated scan'
		}
	}
	catch {
		Write-Warning "Failed to authenticate: $($_.Exception.Message) — running unauthenticated scan"
	}

	# Run ZAP baseline scan
	Write-Host 'Running OWASP ZAP baseline scan...' -ForegroundColor Cyan
	$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'

	$dockerArgs = @(
		'run', '--rm',
		'--network', 'seventysix-dast-network',
		'-v', "${repoRoot}/.zap:/zap/wrk/.zap:ro",
		'-v', "${reportDir}:/zap/wrk/reports"
	)

	if ($zapAuthToken) {
		$dockerArgs += @('-e', "ZAP_AUTH_TOKEN=$zapAuthToken")
	}

	$dockerArgs += @(
		'ghcr.io/zaproxy/zaproxy:stable',
		'zap-baseline.py',
		'-t', 'https://client-dast:8443',
		'-c', '.zap/rules.tsv',
		'-a',
		'-j',
		'-r', "reports/dast-report-${timestamp}.html",
		'-J', "reports/dast-report-${timestamp}.json",
		'-w', "reports/dast-report-${timestamp}.md"
	)

	if ($zapAuthToken) {
		$dockerArgs += @('--hook', '.zap/auth-hook.py')
	}

	& docker @dockerArgs

	Write-Host "DAST scan complete. Reports saved to: $reportDir" -ForegroundColor Green
}
finally {
	# Teardown
	Write-Host 'Tearing down DAST infrastructure...' -ForegroundColor Cyan
	docker compose -f docker-compose.dast.yml down -v --remove-orphans
	Pop-Location
}
