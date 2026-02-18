# start-infrastructure.ps1
# Starts infrastructure services (Postgres, Jaeger, Prometheus, Grafana) for local development
# Use this when debugging the API in Visual Studio
#
# Usage:
#   .\scripts\start-infrastructure.ps1           # Start in detached mode
#   .\scripts\start-infrastructure.ps1 -Attached # Start in attached mode (see logs)

param(
	[switch]$Attached
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SeventySix Infrastructure Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Clean up orphaned processes before starting (prevents port conflicts)
& (Join-Path $PSScriptRoot "internal" "cleanup-ports.ps1")

# Export user secrets as environment variables for Docker Compose
Write-Host "Loading secrets from user-secrets store..." -ForegroundColor Yellow
& (Join-Path $PSScriptRoot "internal" "load-user-secrets.ps1")
if ($LASTEXITCODE -ne 0) { exit 1 }

# Ensure Docker Desktop is running
if (-not (Get-Process 'Docker Desktop' -ErrorAction SilentlyContinue)) {
	Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow
	Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
	Write-Host "Waiting for Docker to initialize..." -ForegroundColor Yellow
	Start-Sleep -Seconds 15
}

# Wait for Docker to be fully ready (not just the process, but the daemon)
Write-Host "Checking Docker daemon status..." -ForegroundColor Yellow
$maxWaitSeconds = 60
$waitedSeconds = 0
$dockerReady = $false

while (-not $dockerReady -and $waitedSeconds -lt $maxWaitSeconds) {
	try {
		$dockerVersion =
		docker version --format "{{.Server.Version}}" 2>$null
		if ($dockerVersion) {
			$dockerReady = $true
			Write-Host "  Docker daemon ready (v$dockerVersion)" -ForegroundColor Green
		}
	}
	catch {
		# Docker not ready yet
	}

	if (-not $dockerReady) {
		Start-Sleep -Seconds 2
		$waitedSeconds += 2
		Write-Host "  Waiting for Docker daemon... ($waitedSeconds/$maxWaitSeconds seconds)" -ForegroundColor DarkGray
	}
}

if (-not $dockerReady) {
	Write-Host ""
	Write-Host "ERROR: Docker daemon did not start within $maxWaitSeconds seconds" -ForegroundColor Red
	Write-Host "  Please start Docker Desktop manually and try again" -ForegroundColor Yellow
	Write-Host ""
	exit 1
}

# Stop any existing API container to free ports for Visual Studio debugging
Write-Host "Ensuring API ports are free for debugging..." -ForegroundColor Yellow
& (Join-Path $PSScriptRoot "stop-api.ps1")

# Check SSL certificate exists for nginx-proxy
$certificatePath =
Join-Path $PSScriptRoot "..\SeventySix.Client\ssl\dev-certificate.crt"

if (-not (Test-Path $certificatePath)) {
	Write-Host "SSL certificate not found. Generating..." -ForegroundColor Yellow
	& (Join-Path $PSScriptRoot "generate-dev-ssl-cert.ps1")

	if (-not (Test-Path $certificatePath)) {
		Write-Host "Failed to generate SSL certificate!" -ForegroundColor Red
		exit 1
	}
}

# Change to repository root directory
Push-Location (Join-Path $PSScriptRoot "..")

try {
	# Infrastructure services including HTTPS proxy (not the API)
	$infrastructureServices =
	@(
		"postgres",
		"valkey",
		"redis-exporter",
		"otel-collector",
		"jaeger",
		"prometheus",
		"grafana",
		"pgadmin",
		"redisinsight",
		"nginx-proxy"
	)

	Write-Host "Starting services: $($infrastructureServices -join ', ')" -ForegroundColor Cyan
	Write-Host ""

	if ($Attached) {
		docker compose up $infrastructureServices
	}
	else {
		docker compose up -d $infrastructureServices

		Write-Host ""
		Write-Host "Infrastructure services started!" -ForegroundColor Green
		Write-Host ""
		Write-Host "Services available at:" -ForegroundColor Cyan
		Write-Host "  PostgreSQL:       localhost:5433" -ForegroundColor White
		Write-Host "  Valkey:           localhost:6379" -ForegroundColor White
		Write-Host "  OTel Collector:   localhost:4317 (OTLP gRPC)" -ForegroundColor White
		Write-Host ""
		Write-Host "Observability (via HTTPS proxy):" -ForegroundColor Cyan
		Write-Host "  pgAdmin:          https://localhost:5051" -ForegroundColor White
		Write-Host "  RedisInsight:     https://localhost:5541" -ForegroundColor White
		Write-Host "  Jaeger UI:        https://localhost:16687" -ForegroundColor White
		Write-Host "  Prometheus:       https://localhost:9091" -ForegroundColor White
		Write-Host "  Grafana:          https://localhost:3443" -ForegroundColor White
		Write-Host ""

		# Start client in new PowerShell window if not already running
		$clientPort = 4200
		$clientRunning = $false
		try {
			$tcpConnection =
			Get-NetTCPConnection -LocalPort $clientPort -ErrorAction SilentlyContinue
			if ($tcpConnection) {
				$clientRunning = $true
				Write-Host "Angular client already running on port $clientPort" -ForegroundColor Green
			}
		}
		catch {
			# Port not in use
		}

		if (-not $clientRunning) {
			Write-Host "Starting Angular client in new window..." -ForegroundColor Cyan
			$clientPath =
			Join-Path $PSScriptRoot "..\SeventySix.Client"
			Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$clientPath'; npm start"
		}

		Write-Host ""
		Write-Host "========================================" -ForegroundColor Yellow
		Write-Host "  Next Steps:" -ForegroundColor Yellow
		Write-Host "========================================" -ForegroundColor Yellow
		Write-Host ""
		Write-Host "  1. Open SeventySix.Server.slnx in Visual Studio 2026" -ForegroundColor White
		Write-Host "  2. Select 'https' launch profile" -ForegroundColor White
		Write-Host "  3. Press F5 to start debugging" -ForegroundColor White
		Write-Host ""
		Write-Host "To stop infrastructure:" -ForegroundColor Cyan
		Write-Host "  npm run stop" -ForegroundColor White
		Write-Host ""
	}
}
finally {
	Pop-Location
}
