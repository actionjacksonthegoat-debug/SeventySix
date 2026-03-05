# start-dev.ps1
# Starts API container and launches Angular client in separate window.
# Automatically cleans up orphaned processes before starting.
#
# Usage:
#   npm run start
#   .\scripts\start-dev.ps1
#   .\scripts\start-dev.ps1 -SkipCleanup  # Skip cleanup (faster restart)

param(
	[switch]$SkipCleanup
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SeventySix Development Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Export user secrets as environment variables for Docker Compose
# MUST happen BEFORE cert checks so DATA_PROTECTION_CERTIFICATE_PASSWORD is available
Write-Host "Loading secrets from user-secrets store..." -ForegroundColor Yellow
& (Join-Path $PSScriptRoot "internal" "load-user-secrets.ps1")
if ($LASTEXITCODE -ne 0) { exit 1 }

# Check SSL certificate exists before starting
$certificatePath =
"$PSScriptRoot\..\SeventySix.Client\ssl\dev-certificate.crt"

if (-not (Test-Path $certificatePath)) {
	Write-Host "SSL certificate not found. Generating..." -ForegroundColor Yellow
	& "$PSScriptRoot\generate-dev-ssl-cert.ps1"

	if (-not (Test-Path $certificatePath)) {
		Write-Host "Failed to generate SSL certificate!" -ForegroundColor Red
		exit 1
	}
}

# Check DataProtection certificate exists before starting
# See docs/Startup-Instructions.md > "Regenerating the DataProtection Certificate" for cleanup steps
$dataProtectionCertPath =
"$PSScriptRoot\..\SeventySix.Server\SeventySix.Api\keys\dataprotection.pfx"

if (-not (Test-Path $dataProtectionCertPath)) {
	Write-Host "DataProtection certificate not found. Generating..." -ForegroundColor Yellow
	& "$PSScriptRoot\generate-dataprotection-cert.ps1"

	if (-not (Test-Path $dataProtectionCertPath)) {
		Write-Host "Failed to generate DataProtection certificate!" -ForegroundColor Red
		exit 1
	}
}
else {
	# Certificate exists — verify it can be read with the current password
	# If password mismatch, delete and regenerate (prevents unencrypted key fallback)
	$certPassword = $env:DATA_PROTECTION_CERTIFICATE_PASSWORD
	if ($certPassword) {
		try {
			$certBytes = [System.IO.File]::ReadAllBytes(
				(Resolve-Path $dataProtectionCertPath).Path)
			$null = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new(
				$certBytes,
				$certPassword,
				[System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::EphemeralKeySet)
			Write-Host "DataProtection certificate password verified." -ForegroundColor Green
		}
		catch {
			Write-Host "DataProtection certificate password mismatch detected. Regenerating..." -ForegroundColor Yellow
			Remove-Item -Path $dataProtectionCertPath -Force

			# Clear stale encrypted keys from the local keys directory
			$localKeysDir = "$PSScriptRoot\..\SeventySix.Server\SeventySix.Api\keys"
			Get-ChildItem -Path $localKeysDir -Filter "key-*.xml" -ErrorAction SilentlyContinue |
			Remove-Item -Force
			Write-Host "Cleared stale DataProtection key XML files from local keys directory." -ForegroundColor Yellow
			Write-Host "NOTE: If using Docker volume 'dataprotection_keys', run:" -ForegroundColor Cyan
			Write-Host "  docker volume rm seventysix-dev_dataprotection_keys" -ForegroundColor Cyan
			Write-Host "  (Users already logged in will need to sign in again after this.)" -ForegroundColor Cyan

			& "$PSScriptRoot\generate-dataprotection-cert.ps1"

			if (-not (Test-Path $dataProtectionCertPath)) {
				Write-Host "Failed to regenerate DataProtection certificate!" -ForegroundColor Red
				exit 1
			}
		}
	}
	else {
		Write-Host "[WARN] DATA_PROTECTION_CERTIFICATE_PASSWORD not set - skipping cert validation." -ForegroundColor Yellow
	}
}

# Clean up orphaned processes before starting (prevents port conflicts)
if (-not $SkipCleanup) {
	& (Join-Path $PSScriptRoot "internal" "cleanup-ports.ps1")
}

# Start Docker Desktop if not running (Windows only — on Linux Docker runs as a service)
$dockerRunning = $false
try {
	docker info 2>&1 | Out-Null
	$dockerRunning = ($LASTEXITCODE -eq 0)
}
catch { }

if (-not $dockerRunning) {
	if ($IsWindows) {
		Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow
		$dockerDesktopPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
		if (Test-Path $dockerDesktopPath) {
			Start-Process $dockerDesktopPath
		}
		Start-Sleep -Seconds 10
	}
	else {
		Write-Host "Docker daemon is not running. Please start it and try again." -ForegroundColor Red
		exit 1
	}
}

# Start ALL infrastructure services first (without force-recreate to preserve data)
Write-Host "Starting infrastructure services..." -ForegroundColor Yellow
Push-Location "$PSScriptRoot\.."
docker compose up -d postgres valkey redis-exporter otel-collector jaeger prometheus grafana pgadmin redisinsight nginx-proxy
Pop-Location

# Build and start API container (only force-recreate the API to pick up code changes)
# --no-cache ensures uncommitted source changes are always reflected in the built image.
Write-Host "Building and starting API container..." -ForegroundColor Yellow
Push-Location "$PSScriptRoot\.."
docker compose build --no-cache seventysix-api
docker compose up -d --force-recreate seventysix-api
Pop-Location

# Wait for API to be healthy
Write-Host "Waiting for API health check..." -ForegroundColor Yellow
& (Join-Path $PSScriptRoot "internal" "wait-for-api.ps1")

# Bring this API console to the front and set title (Windows only)
if ($IsWindows) {
	Add-Type -Name Win32 -Namespace Console -MemberDefinition @'
[DllImport("kernel32.dll")]
public static extern IntPtr GetConsoleWindow();
[DllImport("user32.dll")]
public static extern bool SetForegroundWindow(IntPtr hWnd);
'@ -ErrorAction SilentlyContinue
	try {
		$consoleHandle = [Console.Win32]::GetConsoleWindow()
		[Console.Win32]::SetForegroundWindow($consoleHandle) | Out-Null
		[Console]::Title = 'SeventySix API'
	}
	catch {
		# If platform doesn't support bringing window to front, ignore
	}
}
# Check if Angular client is already running on port 4200
$clientPortInUse = $false
if ($IsWindows) {
	$clientPortInUse = $null -ne (Get-NetTCPConnection -LocalPort 4200 -State Listen -ErrorAction SilentlyContinue)
}
else {
	$lsofResult = & lsof -ti ":4200" 2>/dev/null
	$clientPortInUse = -not [string]::IsNullOrEmpty($lsofResult)
}

# Verify the port is actually responding (extra safety check)
$clientResponding = $false
if ($clientPortInUse) {
	try {
		$response =
		Invoke-WebRequest -Uri "http://localhost:4200" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
		$clientResponding = ($response.StatusCode -eq 200)
	}
	catch {
		$clientResponding = $false
	}
}

$clientPath =
"$PSScriptRoot\..\SeventySix.Client"

if ($clientPortInUse -and $clientResponding) {
	Write-Host ""
	Write-Host "========================================" -ForegroundColor Yellow
	Write-Host "  Client Already Running" -ForegroundColor Yellow
	Write-Host "========================================" -ForegroundColor Yellow
	Write-Host "  Port 4200 is responding - client is active." -ForegroundColor Yellow
	Write-Host ""
	Write-Host "  Application:" -ForegroundColor White
	Write-Host "    API:          https://localhost:7074" -ForegroundColor Cyan
	Write-Host "    Client:       https://localhost:4200" -ForegroundColor Cyan
	Write-Host ""
	Write-Host "  Observability (via HTTPS proxy):" -ForegroundColor White
	Write-Host "    Grafana:      https://localhost:3443" -ForegroundColor Cyan
	Write-Host "    Jaeger:       https://localhost:16687" -ForegroundColor Cyan
	Write-Host "    Prometheus:   https://localhost:9091" -ForegroundColor Cyan
	Write-Host "    pgAdmin:      https://localhost:5051" -ForegroundColor Cyan
	Write-Host "    RedisInsight: https://localhost:5541" -ForegroundColor Cyan
	Write-Host "========================================" -ForegroundColor Yellow
}
else {
	# Launch Angular client — in a new window on Windows, background process on Linux/macOS
	# (-WindowStyle is a Windows-only parameter and throws on Linux PowerShell)
	Write-Host "Launching Angular client..." -ForegroundColor Yellow

	if ($IsWindows) {
		Start-Process pwsh -ArgumentList @(
			"-NoExit",
			"-Command",
			"cd '$clientPath'; npm start"
		) -WindowStyle Normal
	}
	else {
		# On Linux/macOS (Codespace, CI): run Angular in background, log to file
		$ngLogPath = Join-Path $clientPath "ng-serve.log"
		$ngJob = Start-Job -ScriptBlock {
			Set-Location $using:clientPath
			& npm start 2>&1
		}
		Write-Host "  Angular client starting in background (job $($ngJob.Id))." -ForegroundColor Cyan
		Write-Host "  Logs: $ngLogPath" -ForegroundColor Cyan
		Write-Host "  Open https://localhost:4200 once ready." -ForegroundColor Cyan
	}
}

# Stream API logs in the current console
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Streaming API Logs (Ctrl+C to stop)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Application:" -ForegroundColor White
Write-Host "    API:          https://localhost:7074" -ForegroundColor Cyan
Write-Host "    Client:       https://localhost:4200" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Observability (via HTTPS proxy):" -ForegroundColor White
Write-Host "    Grafana:      https://localhost:3443" -ForegroundColor Cyan
Write-Host "    Jaeger:       https://localhost:16687" -ForegroundColor Cyan
Write-Host "    Prometheus:   https://localhost:9091" -ForegroundColor Cyan
Write-Host "    pgAdmin:      https://localhost:5051" -ForegroundColor Cyan
Write-Host "    RedisInsight: https://localhost:5541" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Push-Location "$PSScriptRoot\.."
docker compose logs -f seventysix-api
Pop-Location