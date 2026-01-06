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

# Verify .env file exists
$envFilePath = Join-Path $PSScriptRoot "..\.env"
if (-not (Test-Path $envFilePath)) {
	Write-Host ""
	Write-Host "ERROR: .env file not found!" -ForegroundColor Red
	Write-Host "Please copy .env.example to .env and configure your values:" -ForegroundColor Yellow
	Write-Host "  Copy-Item .env.example .env" -ForegroundColor White
	Write-Host ""
	exit 1
}

# Change to server directory
Push-Location (Join-Path $PSScriptRoot "..\SeventySix.Server")

try {
	# Infrastructure services (not the API)
	$services = @("postgres", "jaeger", "prometheus", "grafana", "pgadmin")

	Write-Host "Starting services: $($services -join ', ')" -ForegroundColor Cyan
	Write-Host ""

	if ($Attached) {
		docker compose --env-file ../.env up $services
	}
	else {
		docker compose --env-file ../.env up -d $services

		Write-Host ""
		Write-Host "Infrastructure services started!" -ForegroundColor Green
		Write-Host ""
		Write-Host "Services available at:" -ForegroundColor Cyan
		Write-Host "  PostgreSQL:  localhost:5432" -ForegroundColor White
		Write-Host "  pgAdmin:     http://localhost:5050" -ForegroundColor White
		Write-Host "  Jaeger UI:   http://localhost:16686" -ForegroundColor White
		Write-Host "  Prometheus:  http://localhost:9090" -ForegroundColor White
		Write-Host "  Grafana:     http://localhost:3000" -ForegroundColor White
		Write-Host ""
		Write-Host "========================================" -ForegroundColor Yellow
		Write-Host "  Next Steps:" -ForegroundColor Yellow
		Write-Host "========================================" -ForegroundColor Yellow
		Write-Host ""
		Write-Host "  1. Open SeventySix.Server.slnx in Visual Studio 2026" -ForegroundColor White
		Write-Host "  2. Select 'Container (Dockerfile)' launch profile" -ForegroundColor White
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
