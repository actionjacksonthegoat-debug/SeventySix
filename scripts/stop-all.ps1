# stop-all.ps1
# Stops all SeventySix Docker containers and releases API ports
#
# Usage:
#   npm run stop
#   .\scripts\stop-all.ps1

# Don't stop on first error - we want to try all cleanup steps
$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SeventySix Full Shutdown" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

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
Push-Location (Join-Path $PSScriptRoot "..\SeventySix.Server")

try {
	Write-Host "Stopping all Docker containers..." -ForegroundColor Yellow
	docker compose down --remove-orphans 2>$null

	Write-Host ""
	Write-Host "========================================" -ForegroundColor Green
	Write-Host "  All services stopped" -ForegroundColor Green
	Write-Host "========================================" -ForegroundColor Green
	Write-Host ""
}
finally {
	Pop-Location
}
