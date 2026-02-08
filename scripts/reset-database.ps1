<#
.SYNOPSIS
	Resets the SeventySix database to a clean state.

.DESCRIPTION
	Stops containers, removes database volume, and restarts with fresh migrations.
	Supports both development and E2E environments.

	WARNING: This is a USER-ONLY command. AI assistants (Copilot, etc.) must NEVER execute this script.

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

# =============================================================================
# GUARDRAIL: Block automated/non-interactive execution
# =============================================================================
# This script destroys data and must only be run by a human user interactively.
# AI assistants, CI/CD pipelines, and automated tools are blocked.
$isInteractive =
[Environment]::UserInteractive -and
-not [Console]::IsInputRedirected -and
-not [Console]::IsOutputRedirected

if (-not $isInteractive) {
	Write-Host "`n[BLOCKED] This script requires interactive execution by a human user." -ForegroundColor Red
	Write-Host "AI assistants and automated tools are not permitted to run db:reset." -ForegroundColor Red
	Write-Host "Please run this command manually in a terminal.`n" -ForegroundColor Yellow
	exit 1
}

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
	# Stage 1: Initial warning (Yellow)
	Write-Host ""
	Write-Host "========================================" -ForegroundColor Yellow
	Write-Host "  WARNING: DESTRUCTIVE OPERATION" -ForegroundColor Yellow
	Write-Host "========================================" -ForegroundColor Yellow
	Write-Host ""
	Write-Host "This will permanently delete:" -ForegroundColor Yellow
	Write-Host "  - All database tables" -ForegroundColor White
	Write-Host "  - All user data" -ForegroundColor White
	Write-Host "  - All application data" -ForegroundColor White
	Write-Host ""

	$firstConfirmation =
		Read-Host "Type 'yes' to continue or anything else to abort"

	if ($firstConfirmation -ne "yes") {
		Write-Host ""
		Write-Host "Aborted. No changes were made." -ForegroundColor Green
		exit 0
	}

	# Stage 2: DANGER confirmation (Red ASCII art)
	Write-Host ""
	Write-Host "========================================" -ForegroundColor Red
	Write-Host "  ██████╗  █████╗ ███╗   ██╗ ██████╗ ███████╗██████╗ " -ForegroundColor Red
	Write-Host "  ██╔══██╗██╔══██╗████╗  ██║██╔════╝ ██╔════╝██╔══██╗" -ForegroundColor Red
	Write-Host "  ██║  ██║███████║██╔██╗ ██║██║  ███╗█████╗  ██████╔╝" -ForegroundColor Red
	Write-Host "  ██║  ██║██╔══██║██║╚██╗██║██║   ██║██╔══╝  ██╔══██╗" -ForegroundColor Red
	Write-Host "  ██████╔╝██║  ██║██║ ╚████║╚██████╔╝███████╗██║  ██║" -ForegroundColor Red
	Write-Host "  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝" -ForegroundColor Red
	Write-Host "========================================" -ForegroundColor Red
	Write-Host ""
	Write-Host "  THIS ACTION CANNOT BE UNDONE!" -ForegroundColor Red
	Write-Host ""
	Write-Host "  You are about to PERMANENTLY DESTROY:" -ForegroundColor White
	Write-Host "    Volume: $volumeName" -ForegroundColor Magenta
	Write-Host ""

	$finalConfirmation =
		Read-Host "Type 'DESTROY' in all caps to confirm"

	if ($finalConfirmation -ne "DESTROY") {
		Write-Host ""
		Write-Host "Aborted. Database is unchanged." -ForegroundColor Green
		exit 0
	}

	Write-Host ""
	Write-Host "Proceeding with database reset..." -ForegroundColor Yellow
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
