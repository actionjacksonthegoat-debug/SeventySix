# stop-api.ps1
# Stops the seventysix-api-dev container (from npm run start) to free ports for Visual Studio debugging
# This script does NOT kill Visual Studio debug processes - only the Docker container from npm run start
#
# Usage:
#   .\scripts\stop-api.ps1
#   npm run stop:api

# Don't stop on first error - we want to try all cleanup steps
$ErrorActionPreference = "Continue"

$apiContainerName = "seventysix-api-dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Stopping API Container" -ForegroundColor Cyan
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
	Write-Host "  Skipping container cleanup" -ForegroundColor DarkGray
	Write-Host ""
	Write-Host "Port 7074 should be free for Visual Studio debugging" -ForegroundColor Green
	Write-Host ""
	exit 0
}

# Stop the seventysix-api-dev container if it exists (from npm run start)
$containerExists =
	docker ps -a --format "{{.Names}}" 2>$null |
	Where-Object { $_ -eq $apiContainerName }

if ($containerExists) {
	Write-Host "Stopping container: $apiContainerName" -ForegroundColor Yellow
	docker stop $apiContainerName 2>$null | Out-Null
	docker rm $apiContainerName 2>$null | Out-Null
	Write-Host "  Container stopped and removed" -ForegroundColor Green
}
else {
	Write-Host "Container $apiContainerName not running" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Port 7074 should be free for Visual Studio debugging" -ForegroundColor Green
Write-Host ""
