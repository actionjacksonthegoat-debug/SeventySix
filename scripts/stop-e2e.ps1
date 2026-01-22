# stop-e2e.ps1
# Stops E2E environment and removes all data volumes.

$ErrorActionPreference = "Stop"

Write-Host "Stopping E2E environment and removing volumes..." -ForegroundColor Yellow
docker compose -f docker-compose.e2e.yml down -v

Write-Host "E2E environment stopped." -ForegroundColor Green
