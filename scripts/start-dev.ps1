# start-dev.ps1
# Starts API container and launches Angular client in separate window.
# Skips client launch if port 4200 is already in use.

param()

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SeventySix Development Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

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
docker compose build seventysix-api --no-cache
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

# Also check for an existing process running the client (npm start in SeventySix.Client)
$existingClientProcess =
	Get-CimInstance Win32_Process -ErrorAction SilentlyContinue
	| Where-Object {
		($_.Name -match 'powershell|pwsh|node') -and (
			($_.CommandLine -match 'npm start') -or ($_.CommandLine -match 'SeventySix.Client')
		)
	}

if ($clientPortInUse -or $existingClientProcess) {
	Write-Host ""
	Write-Host "========================================" -ForegroundColor Yellow
	Write-Host "  Client Already Running" -ForegroundColor Yellow
	Write-Host "========================================" -ForegroundColor Yellow
	Write-Host "  Detected existing client process or port 4200 in use." -ForegroundColor Yellow
	Write-Host "  Skipping client launch - already active." -ForegroundColor Yellow
	Write-Host "  API:    http://localhost:5085" -ForegroundColor Cyan
	Write-Host "  Client: http://localhost:4200" -ForegroundColor Cyan
	Write-Host "========================================" -ForegroundColor Yellow
}
else {
	# Launch Angular client in NEW PowerShell window
	$clientPath =
		"$PSScriptRoot\..\SeventySix.Client"
	Write-Host "Launching Angular client in new window..." -ForegroundColor Yellow

	Start-Process powershell -ArgumentList @(
		"-NoExit",
		"-Command",
		"Set-Location '$clientPath'; npm start"
	) -WindowStyle Normal

	Write-Host ""
	Write-Host "========================================" -ForegroundColor Green
	Write-Host "  API Ready - Client in New Window" -ForegroundColor Green
	Write-Host "========================================" -ForegroundColor Green
	Write-Host "  API:    http://localhost:5085" -ForegroundColor Cyan
	Write-Host "  Client: http://localhost:4200" -ForegroundColor Cyan
	Write-Host "========================================" -ForegroundColor Green
}