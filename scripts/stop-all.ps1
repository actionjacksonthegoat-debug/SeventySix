# stop-all.ps1
# Stops the SeventySix DEV Docker containers, releases API ports, and kills orphaned processes
#
# SCOPE: Dev environment only by default. Use -All to tear down E2E and LoadTest too.
#        E2E/LoadTest cleanup is normally handled by their own runner scripts.
#
# Usage:
#   npm run stop              # Dev only (default)
#   .\scripts\stop-all.ps1   # Dev only (default)
#   .\scripts\stop-all.ps1 -All  # All environments (dev + e2e + loadtest)

param(
	[switch]$All
)

# Don't stop on first error - we want to try all cleanup steps
$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SeventySix Full Shutdown" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# First, kill any orphaned local processes on development ports
& (Join-Path $PSScriptRoot "internal" "cleanup-ports.ps1")

# Check if Docker is available
$dockerAvailable = $false
try {
	$dockerVersion =
	docker version --format "{{.Server.Version}}" 2>$null
	if ($dockerVersion) {
		$dockerAvailable = $true
	}
}
catch {
	# Docker not available
}

if (-not $dockerAvailable) {
	Write-Host "Docker is not running or not available" -ForegroundColor Yellow
	Write-Host "  Nothing to stop" -ForegroundColor DarkGray
	Write-Host ""
	exit 0
}

# Stop API container first
& (Join-Path $PSScriptRoot "stop-api.ps1")

# Stop all Docker containers
Push-Location (Join-Path $PSScriptRoot "..")

try {
	# Stop dev Docker containers explicitly (not E2E or LoadTest)
	# E2E cleanup: docker compose -f docker-compose.e2e.yml down -v --remove-orphans
	# LoadTest cleanup: docker compose -f docker-compose.loadtest.yml down --remove-orphans
	Write-Host "Stopping dev Docker containers..." -ForegroundColor Yellow
	docker compose -f docker-compose.yml -f docker-compose.override.yml down --remove-orphans 2>$null

	if ($All) {
		Write-Host ""
		Write-Host "Stopping E2E environment..." -ForegroundColor Yellow
		docker compose -f docker-compose.e2e.yml down -v --remove-orphans 2>$null

		Write-Host "Stopping LoadTest environment..." -ForegroundColor Yellow
		docker compose -f docker-compose.loadtest.yml down --remove-orphans 2>$null
	}

	Write-Host ""
	Write-Host "========================================" -ForegroundColor Green
	Write-Host "  All services stopped" -ForegroundColor Green
	Write-Host "========================================" -ForegroundColor Green
	Write-Host ""
}
finally {
	Pop-Location
}
