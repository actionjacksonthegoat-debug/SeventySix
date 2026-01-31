# cleanup-docker.ps1
# Safely removes unused Docker resources to reclaim disk space.
# Run manually when Docker disk usage grows large.

param(
	[switch]$Force,
	[switch]$IncludeVolumes
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Docker Cleanup - SeventySix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Show current disk usage
Write-Host "Current Docker disk usage:" -ForegroundColor Yellow
docker system df
Write-Host ""

if (-not $Force)
{
	$confirmation =
		Read-Host "Proceed with cleanup? (y/n)"
	if ($confirmation -ne 'y')
	{
		Write-Host "Cleanup cancelled." -ForegroundColor Yellow
		exit 0
	}
}

# Remove stopped containers
Write-Host ""
Write-Host "Removing stopped containers..." -ForegroundColor Yellow
docker container prune -f

# Remove dangling images (untagged)
Write-Host ""
Write-Host "Removing dangling images..." -ForegroundColor Yellow
docker image prune -f

# Remove unused images older than 7 days
Write-Host ""
Write-Host "Removing unused images older than 7 days..." -ForegroundColor Yellow
docker image prune -a -f --filter "until=168h"

# Remove build cache, keeping 2GB
Write-Host ""
Write-Host "Removing build cache (keeping 2GB)..." -ForegroundColor Yellow
docker builder prune -f --keep-storage 2GB

if ($IncludeVolumes)
{
	Write-Host ""
	Write-Host "WARNING: Removing SeventySix volumes (data loss possible)..." -ForegroundColor Red

	# First, stop all SeventySix containers to release volume locks
	Write-Host "Stopping SeventySix containers..." -ForegroundColor Yellow
	Push-Location "$PSScriptRoot\.."
	$ErrorActionPreference = "SilentlyContinue"
	docker compose down --remove-orphans 2>&1 | Out-Null
	$ErrorActionPreference = "Stop"
	Pop-Location

	# Remove all seventysix_* volumes explicitly (handles both old 'seventysixserver' and new 'seventysix' projects)
	Write-Host "Removing SeventySix volumes..." -ForegroundColor Yellow
	$volumes =
		docker volume ls --format "{{.Name}}" | Where-Object { $_ -match "^seventysix" }

	foreach ($volume in $volumes)
	{
		Write-Host "  Removing: $volume" -ForegroundColor DarkYellow
		$ErrorActionPreference = "SilentlyContinue"
		docker volume rm $volume --force 2>&1 | Out-Null
		$ErrorActionPreference = "Stop"
	}

	# Also run standard prune for any remaining unused volumes
	docker volume prune -f
}

# Show new disk usage
Write-Host ""
Write-Host "New Docker disk usage:" -ForegroundColor Green
docker system df

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Cleanup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
