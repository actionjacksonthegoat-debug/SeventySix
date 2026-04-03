# run-load-tests.ps1
# Windows orchestrator for SeventySixCommerce SvelteKit load tests
#
# Usage:
#   .\scripts\run-load-tests.ps1                          # Smoke profile, all scenarios
#   .\scripts\run-load-tests.ps1 -TestProfile load          # Load profile
#   .\scripts\run-load-tests.ps1 -TestProfile stress         # Stress profile
#   .\scripts\run-load-tests.ps1 -Scenario health/health-check  # Single scenario
#   .\scripts\run-load-tests.ps1 -KeepRunning               # Don't stop containers after

param(
	[ValidateSet("quick", "smoke", "load", "stress")]
	[string]$TestProfile = "smoke",

	[string]$Scenario = "",

	[switch]$KeepRunning
)

$ErrorActionPreference = "Stop"
$LoadTestRoot = $PSScriptRoot | Split-Path -Parent
$RepoRoot = $LoadTestRoot | Split-Path -Parent | Split-Path -Parent

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SvelteKit Load Tests ($TestProfile)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check k6 is installed
$k6Command = Get-Command k6 -ErrorAction SilentlyContinue
if (-not $k6Command) {
	Write-Host "ERROR: k6 is not installed." -ForegroundColor Red
	Write-Host ""
	Write-Host "Install k6 using one of these methods:" -ForegroundColor Yellow
	Write-Host "  winget install grafana.k6" -ForegroundColor White
	Write-Host "  choco install k6" -ForegroundColor White
	Write-Host "  https://grafana.com/docs/k6/latest/set-up/install-k6/" -ForegroundColor White
	Write-Host ""
	exit 1
}

Write-Host "k6 found: $(k6 version)" -ForegroundColor Green

# 1b. Clean stale results/reports from previous runs
Write-Host ""
Write-Host "Cleaning previous results..." -ForegroundColor Cyan
$resultsDir = Join-Path $LoadTestRoot "results"
$reportsDir = Join-Path $LoadTestRoot "reports"
foreach ($dir in @($resultsDir, $reportsDir)) {
	if (Test-Path $dir) {
		Get-ChildItem -Path $dir -Exclude ".gitkeep" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
	}
}

# 2. Start Docker load test environment
Write-Host ""
Write-Host "Starting SvelteKit load test environment..." -ForegroundColor Cyan
Push-Location $RepoRoot
try {
	docker compose -f docker-compose.loadtest-svelte.yml up -d --build
}
catch {
	Write-Host "ERROR: Failed to start Docker environment." -ForegroundColor Red
	Write-Host $_.Exception.Message -ForegroundColor Red
	Pop-Location
	exit 1
}
Pop-Location

# 3. Wait for app health check
Write-Host ""
Write-Host "Waiting for SvelteKit app to become healthy..." -ForegroundColor Cyan
$maxAttempts = 60
$attempt = 0
$appHealthy = $false

while ($attempt -lt $maxAttempts) {
	$attempt++
	try {
		$response = Invoke-WebRequest -Uri "http://localhost:3021/healthz" -TimeoutSec 5 -ErrorAction SilentlyContinue -UseBasicParsing
		if ($response.StatusCode -eq 200) {
			$appHealthy = $true
			break
		}
	}
	catch {
		# App not ready yet
	}
	Write-Host "  Attempt $attempt/$maxAttempts - App not ready..." -ForegroundColor Gray
	Start-Sleep -Seconds 5
}

if (-not $appHealthy) {
	Write-Host "ERROR: App failed to become healthy after $maxAttempts attempts." -ForegroundColor Red
	if (-not $KeepRunning) {
		Push-Location $RepoRoot
		docker compose -f docker-compose.loadtest-svelte.yml down
		Pop-Location
	}
	exit 1
}

Write-Host "SvelteKit app is healthy!" -ForegroundColor Green

# 4. Run k6 scenarios
Write-Host ""
Write-Host "Running k6 load tests (profile: $TestProfile)..." -ForegroundColor Cyan
$exitCode = 0

$savedErrorPref = $ErrorActionPreference
$ErrorActionPreference = "Continue"

Push-Location $LoadTestRoot

if ($Scenario) {
	# Run single scenario
	$scenarioPath = "scenarios/$Scenario.test.js"
	if (-not (Test-Path $scenarioPath)) {
		$scenarioPath = "scenarios/$Scenario"
	}
	Write-Host "  Running: $scenarioPath" -ForegroundColor White
	$null | k6 run -q --env PROFILE=$TestProfile $scenarioPath 2>&1 | ForEach-Object { "$_" }
	if ($LASTEXITCODE -ne 0) { $exitCode = 1 }
}
else {
	# Run all scenarios
	$scenarioFiles = Get-ChildItem -Path "scenarios" -Recurse -Filter "*.test.js"
	foreach ($file in $scenarioFiles) {
		$relativePath = $file.FullName.Substring($LoadTestRoot.Length + 1).Replace("\", "/")
		Write-Host "  Running: $relativePath" -ForegroundColor White
		$null | k6 run -q --env PROFILE=$TestProfile $relativePath 2>&1 | ForEach-Object { "$_" }
		if ($LASTEXITCODE -ne 0) {
			Write-Host "  FAILED: $relativePath" -ForegroundColor Red
			$exitCode = 1
		}
		else {
			Write-Host "  PASSED: $relativePath" -ForegroundColor Green
		}
	}
}

$ErrorActionPreference = $savedErrorPref

Pop-Location

# 5. Generate summary report
Write-Host ""
Write-Host "Generating summary report..." -ForegroundColor Cyan
node (Join-Path $LoadTestRoot "scripts\generate-summary.js")

# 6. Open summary in browser
$summaryPath = Join-Path $LoadTestRoot "reports\summary.html"
if (Test-Path $summaryPath) {
	Write-Host "Opening summary report..." -ForegroundColor Cyan
	Start-Process $summaryPath
}

# 7. Stop containers (unless -KeepRunning)
if (-not $KeepRunning) {
	Write-Host ""
	Write-Host "Stopping load test environment..." -ForegroundColor Cyan
	Push-Location $RepoRoot
	docker compose -f docker-compose.loadtest-svelte.yml down
	Pop-Location
}
else {
	Write-Host ""
	Write-Host "Environment left running (-KeepRunning specified)." -ForegroundColor Yellow
	Write-Host "Stop manually: docker compose -f docker-compose.loadtest-svelte.yml down" -ForegroundColor Yellow
}

Write-Host ""
if ($exitCode -eq 0) {
	Write-Host "All load tests PASSED!" -ForegroundColor Green
}
else {
	Write-Host "Some load tests FAILED. Check reports for details." -ForegroundColor Red
}

exit $exitCode
