# start-dev.ps1
# Starts API container and launches Angular client in separate window.
# Automatically cleans up orphaned processes before starting.
#
# Usage:
#   npm run start
#   .\scripts\start-dev.ps1
#   .\scripts\start-dev.ps1 -SkipCleanup  # Skip cleanup (faster restart)

param(
	[switch]$SkipCleanup
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SeventySix Development Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Clean up orphaned processes before starting (prevents port conflicts)
if (-not $SkipCleanup) {
	& (Join-Path $PSScriptRoot "cleanup-ports.ps1")
}

# Start Docker Desktop if not running
$dockerProcess =
	Get-Process 'Docker Desktop' -ErrorAction SilentlyContinue
if (-not $dockerProcess) {
	Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow
	Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
	Start-Sleep -Seconds 10
}

# Build and start API container
Write-Host "Building and starting API container..." -ForegroundColor Yellow
Push-Location "$PSScriptRoot\..\SeventySix.Server"
docker compose build seventysix-api
docker compose --env-file ../.env up -d --force-recreate
Pop-Location

# Wait for API to be healthy
Write-Host "Waiting for API health check..." -ForegroundColor Yellow
& "$PSScriptRoot\wait-for-api.ps1"

# Bring this API console to the front and set title
Add-Type -Name Win32 -Namespace Console -MemberDefinition @'
[DllImport("kernel32.dll")]
public static extern IntPtr GetConsoleWindow();
[DllImport("user32.dll")]
public static extern bool SetForegroundWindow(IntPtr hWnd);
'@ -ErrorAction SilentlyContinue
try {
	$consoleHandle = [Console.Win32]::GetConsoleWindow()
	[Console.Win32]::SetForegroundWindow($consoleHandle) | Out-Null
	[Console]::Title = 'SeventySix API'
}
catch {
	# If platform doesn't support bringing window to front, ignore
}
# Check if Angular client is already running on port 4200
$clientPortInUse =
	Get-NetTCPConnection -LocalPort 4200 -State Listen -ErrorAction SilentlyContinue

# Verify the port is actually responding (extra safety check)
$clientResponding = $false
if ($clientPortInUse) {
	try {
		$response =
			Invoke-WebRequest -Uri "http://localhost:4200" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
		$clientResponding = ($response.StatusCode -eq 200)
	}
	catch {
		$clientResponding = $false
	}
}

$clientPath =
	"$PSScriptRoot\..\SeventySix.Client"

if ($clientPortInUse -and $clientResponding) {
	Write-Host ""
	Write-Host "========================================" -ForegroundColor Yellow
	Write-Host "  Client Already Running" -ForegroundColor Yellow
	Write-Host "========================================" -ForegroundColor Yellow
	Write-Host "  Port 4200 is responding - client is active." -ForegroundColor Yellow
	Write-Host "  API:    https://localhost:7074" -ForegroundColor Cyan
	Write-Host "  Client: http://localhost:4200" -ForegroundColor Cyan
	Write-Host "========================================" -ForegroundColor Yellow
}
else {
	# Launch Angular client in NEW PowerShell window BEFORE streaming logs
	Write-Host "Launching Angular client in new window..." -ForegroundColor Yellow

	Start-Process powershell -ArgumentList @(
		"-NoExit",
		"-Command",
		"Set-Location '$clientPath'; npm start"
	) -WindowStyle Normal
}

# Stream API logs in the current console
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Streaming API Logs (Ctrl+C to stop)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "  API:    https://localhost:7074" -ForegroundColor Cyan
Write-Host "  Client: http://localhost:4200" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Push-Location "$PSScriptRoot\..\SeventySix.Server"
docker compose logs -f seventysix-api
Pop-Location