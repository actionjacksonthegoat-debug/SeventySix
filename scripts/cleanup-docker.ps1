# cleanup-docker.ps1
# Safely removes unused SeventySix Docker resources to reclaim disk space.
# Only removes containers/images/volumes belonging to the SeventySix project —
# never runs indiscriminate prune commands that could destroy other projects.
#
# SCOPE: By default targets all SeventySix environments (dev, e2e, loadtest).
#        Use -Environment to target a specific one without touching others.
#
# Usage:
#   .\scripts\cleanup-docker.ps1                                       # All SeventySix envs
#   .\scripts\cleanup-docker.ps1 -Environment e2e -Force               # E2E only, no prompt
#   .\scripts\cleanup-docker.ps1 -IncludeVolumes -Environment dev      # Dev only, with volumes

param(
	[switch]$Force,
	[switch]$IncludeVolumes,
	[ValidateSet("all", "dev", "e2e", "loadtest")]
	[string]$Environment = "all"
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

if (-not $Force) {
	$confirmation =
	Read-Host "Proceed with cleanup? (y/n)"
	if ($confirmation -ne 'y') {
		Write-Host "Cleanup cancelled." -ForegroundColor Yellow
		exit 0
	}
}

# Build container name filter based on environment
$containerFilter = switch ($Environment) {
	"dev" { "seventysix-dev" }
	"e2e" { "seventysix-e2e" }
	"loadtest" { "seventysix-loadtest" }
	default { "seventysix" }
}

# Remove stopped SeventySix containers only (not other projects)
Write-Host ""
Write-Host "Removing stopped SeventySix containers ($Environment)..." -ForegroundColor Yellow
$stoppedContainers =
docker ps -a --filter "status=exited" --filter "name=$containerFilter" --format "{{.ID}}"
if ($stoppedContainers) {
	foreach ($container in $stoppedContainers) {
		docker rm $container 2>$null | Out-Null
	}
	Write-Host "  Removed $($stoppedContainers.Count) stopped container(s)" -ForegroundColor DarkYellow
}
else {
	Write-Host "  No stopped containers to remove" -ForegroundColor DarkGray
}

# Remove dangling SeventySix images only
Write-Host ""
Write-Host "Removing dangling SeventySix images..." -ForegroundColor Yellow
$danglingImages =
docker images --filter "dangling=true" --format "{{.Repository}}|{{.ID}}" |
Where-Object { $_ -match "seventysix" }
if ($danglingImages) {
	foreach ($image in $danglingImages) {
		$imageId = ($image -split "\|")[1]
		docker rmi $imageId -f 2>$null | Out-Null
	}
	Write-Host "  Removed $($danglingImages.Count) dangling image(s)" -ForegroundColor DarkYellow
}
else {
	Write-Host "  No dangling images to remove" -ForegroundColor DarkGray
}

# Remove SeventySix images older than 7 days
Write-Host ""
Write-Host "Removing SeventySix images older than 7 days..." -ForegroundColor Yellow
$oldImages =
docker images --filter "until=168h" --format "{{.Repository}}|{{.ID}}" |
Where-Object { $_ -match "seventysix" }
if ($oldImages) {
	foreach ($image in $oldImages) {
		$imageId = ($image -split "\|")[1]
		docker rmi $imageId -f 2>$null | Out-Null
	}
	Write-Host "  Removed $($oldImages.Count) old image(s)" -ForegroundColor DarkYellow
}
else {
	Write-Host "  No old images to remove" -ForegroundColor DarkGray
}

# Remove build cache, keeping 2GB
Write-Host ""
Write-Host "Removing build cache (keeping 2GB)..." -ForegroundColor Yellow
docker builder prune -f --keep-storage 2GB

if ($IncludeVolumes) {
	Write-Host ""
	Write-Host "WARNING: Removing SeventySix volumes ($Environment) (data loss possible)..." -ForegroundColor Red

	# Build volume filter based on environment
	$volumePattern = switch ($Environment) {
		"dev" { "^seventysix-dev" }
		"e2e" { "^seventysix-e2e" }
		"loadtest" { "^seventysix-loadtest" }
		default { "^seventysix" }
	}

	# First, stop containers for the targeted environment to release volume locks
	Write-Host "Stopping targeted SeventySix containers..." -ForegroundColor Yellow
	Push-Location "$PSScriptRoot\.."
	$ErrorActionPreference = "SilentlyContinue"
	switch ($Environment) {
		"dev" { docker compose -f docker-compose.yml -f docker-compose.override.yml down --remove-orphans 2>&1 | Out-Null }
		"e2e" { docker compose -f docker-compose.e2e.yml down -v --remove-orphans 2>&1 | Out-Null }
		"loadtest" { docker compose -f docker-compose.loadtest.yml down --remove-orphans 2>&1 | Out-Null }
		default {
			docker compose -f docker-compose.yml -f docker-compose.override.yml down --remove-orphans 2>&1 | Out-Null
			docker compose -f docker-compose.e2e.yml down -v --remove-orphans 2>&1 | Out-Null
			docker compose -f docker-compose.loadtest.yml down --remove-orphans 2>&1 | Out-Null
		}
	}
	$ErrorActionPreference = "Stop"
	Pop-Location

	# Remove SeventySix volumes matching environment (excluding PostgreSQL — use 'npm run db:reset' for database reset, USER ONLY)
	Write-Host "Removing SeventySix volumes (excluding PostgreSQL)..." -ForegroundColor Yellow
	$volumes =
	docker volume ls --format "{{.Name}}" | Where-Object { $_ -match $volumePattern -and $_ -notmatch "postgres" }

	$postgresVolumes =
	docker volume ls --format "{{.Name}}" | Where-Object { $_ -match $volumePattern -and $_ -match "postgres" }

	if ($postgresVolumes) {
		Write-Host ""
		foreach ($pgVolume in $postgresVolumes) {
			Write-Host "  Skipping PostgreSQL volume: $pgVolume" -ForegroundColor Yellow
		}
		Write-Host "  -> Use 'npm run db:reset' to reset the database (USER ONLY)" -ForegroundColor Yellow
		Write-Host ""
	}

	foreach ($volume in $volumes) {
		Write-Host "  Removing: $volume" -ForegroundColor DarkYellow
		$ErrorActionPreference = "SilentlyContinue"
		docker volume rm $volume --force 2>&1 | Out-Null
		$ErrorActionPreference = "Stop"
	}
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
