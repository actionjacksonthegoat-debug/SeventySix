<#
.SYNOPSIS
	Resets the SeventySix database to a clean state.

.DESCRIPTION
	Stops containers, removes database volume, and restarts with fresh migrations.
	Supports both development and E2E environments.

.PARAMETER Environment
	Target environment: 'dev' (default) or 'e2e'

.PARAMETER SkipConfirmation
	Skip the confirmation prompt for destructive operations.

.EXAMPLE
	.\reset-database.ps1 -Environment dev
	.\reset-database.ps1 -Environment e2e -SkipConfirmation
#>
param(
	[ValidateSet("dev", "e2e")]
	[string]$Environment = "dev",

	[switch]$SkipConfirmation
)

$ErrorActionPreference = "Stop"

$composeFile =
switch ($Environment) {
	"dev" { "docker-compose.yml" }
	"e2e" { "docker-compose.e2e.yml" }
}

$volumeName =
switch ($Environment) {
	"dev" { "seventysix_postgres_data" }
	"e2e" { "seventysix_e2e_postgres_data" }
}

Write-Host "`n=== SeventySix Database Reset ===" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Compose File: $composeFile" -ForegroundColor Yellow
Write-Host "Volume: $volumeName" -ForegroundColor Yellow

if (-not $SkipConfirmation) {
	$confirmation =
	Read-Host "`nThis will DELETE all database data. Continue? (y/n)"

	if ($confirmation -ne "y") {
		Write-Host "Aborted." -ForegroundColor Red
		exit 0
	}
}

Write-Host "`n[1/4] Stopping containers..." -ForegroundColor Green
$ErrorActionPreference = "SilentlyContinue"
docker compose -f $composeFile down --remove-orphans 2>&1 | Out-Null
$ErrorActionPreference = "Stop"

Write-Host "[2/4] Removing database volume..." -ForegroundColor Green
$ErrorActionPreference = "SilentlyContinue"
docker volume rm $volumeName 2>&1 | Out-Null
$ErrorActionPreference = "Stop"

Write-Host "[3/4] Starting fresh containers..." -ForegroundColor Green
$ErrorActionPreference = "SilentlyContinue"
docker compose -f $composeFile up -d 2>&1 | Out-Null
$ErrorActionPreference = "Stop"

Write-Host "[4/4] Waiting for database to be ready..." -ForegroundColor Green
Start-Sleep -Seconds 10

Write-Host "`n=== Database Reset Complete ===" -ForegroundColor Cyan
Write-Host "Fresh database with migrations applied.`n" -ForegroundColor Green
