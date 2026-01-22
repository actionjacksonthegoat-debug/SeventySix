# start-e2e.ps1
# Starts fresh E2E environment with clean database and cache.
# Usage: .\scripts\start-e2e.ps1 [-RunTests] [-KeepRunning]

param(
	[switch]$RunTests,
	[switch]$KeepRunning
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SeventySix E2E Test Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Stop existing E2E containers and remove volumes
Write-Host "Stopping existing E2E containers..." -ForegroundColor Yellow
docker compose -f docker-compose.e2e.yml down -v 2>$null

# 2. Rebuild API without cache (ensures latest code)
Write-Host "Rebuilding API with latest code (no cache)..." -ForegroundColor Yellow
docker compose -f docker-compose.e2e.yml build --no-cache api-e2e

# 3. Start all services
Write-Host "Starting E2E services..." -ForegroundColor Yellow
docker compose -f docker-compose.e2e.yml up -d

# 4. Wait for health checks
Write-Host "Waiting for services to be healthy..." -ForegroundColor Yellow
Push-Location "$PSScriptRoot\..\SeventySix.Client"
node scripts/wait-for-api.mjs
node scripts/wait-for-client.mjs
Pop-Location

# 5. Run tests if requested
if ($RunTests) {
	Write-Host ""
	Write-Host "Running E2E tests..." -ForegroundColor Green
	Push-Location "$PSScriptRoot\..\SeventySix.Client"
	npm run e2e
	$testExitCode = $LASTEXITCODE
	Pop-Location

	# 6. Teardown unless KeepRunning specified
	if (-not $KeepRunning) {
		Write-Host "Tearing down E2E environment..." -ForegroundColor Yellow
		docker compose -f docker-compose.e2e.yml down -v
	}

	exit $testExitCode
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  E2E Environment Ready" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "  API:     http://localhost:5086" -ForegroundColor Cyan
Write-Host "  Client:  http://localhost:4200" -ForegroundColor Cyan
Write-Host "  MailDev: http://localhost:1080" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
