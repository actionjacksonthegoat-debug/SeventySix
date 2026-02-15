# run-load-tests.ps1
# Windows orchestrator for SeventySix load tests
#
# Usage:
#   .\scripts\run-load-tests.ps1                          # Smoke profile, all scenarios
#   .\scripts\run-load-tests.ps1 -Profile load             # Load profile
#   .\scripts\run-load-tests.ps1 -Profile stress            # Stress profile
#   .\scripts\run-load-tests.ps1 -Scenario auth/login       # Single scenario
#   .\scripts\run-load-tests.ps1 -KeepRunning               # Don't stop containers after

param(
	[ValidateSet("quick", "smoke", "load", "stress")]
	[string]$Profile = "smoke",

	[string]$Scenario = "",

	[switch]$KeepRunning
)

$ErrorActionPreference = "Stop"
$LoadTestRoot = $PSScriptRoot | Split-Path -Parent
$RepoRoot = $LoadTestRoot | Split-Path -Parent | Split-Path -Parent

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SeventySix Load Tests ($Profile)" -ForegroundColor Cyan
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

# 2. Generate SSL certs if missing
$certPath = Join-Path $LoadTestRoot "..\ssl\dev-certificate.crt"
if (-not (Test-Path $certPath)) {
	Write-Host "SSL certificate not found. Generating..." -ForegroundColor Yellow
	$certScript = Join-Path $RepoRoot "scripts\generate-dev-ssl-cert.ps1"
	if (Test-Path $certScript) {
		& $certScript
	}
	else {
		Write-Host "WARNING: Could not find SSL cert generation script." -ForegroundColor Yellow
	}
}

# 3. Start Docker environment
Write-Host ""
Write-Host "Starting load test environment..." -ForegroundColor Cyan
Push-Location $RepoRoot
try {
	docker compose -f docker-compose.loadtest.yml up -d --build
}
catch {
	Write-Host "ERROR: Failed to start Docker environment." -ForegroundColor Red
	Write-Host $_.Exception.Message -ForegroundColor Red
	Pop-Location
	exit 1
}
Pop-Location

# 4. Wait for API health check
Write-Host ""
Write-Host "Waiting for API to become healthy..." -ForegroundColor Cyan
$maxAttempts = 60
$attempt = 0
$apiHealthy = $false

# Bypass SSL cert validation for self-signed dev certificates (PS 5.1 compatible)
if ($PSVersionTable.PSVersion.Major -lt 6) {
	Add-Type @"
using System.Net;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;
public class TrustAllCerts {
	public static void Enable() {
		ServicePointManager.ServerCertificateValidationCallback =
			delegate { return true; };
	}
}
"@
	[TrustAllCerts]::Enable()
}

while ($attempt -lt $maxAttempts) {
	$attempt++
	try {
		$invokeArgs = @{
			Uri             = "https://localhost:7175/health"
			TimeoutSec      = 5
			ErrorAction     = "SilentlyContinue"
			UseBasicParsing = $true
		}
		if ($PSVersionTable.PSVersion.Major -ge 6) {
			$invokeArgs["SkipCertificateCheck"] = $true
		}
		$response = Invoke-WebRequest @invokeArgs
		if ($response.StatusCode -eq 200) {
			$apiHealthy = $true
			break
		}
	}
	catch {
		# API not ready yet
	}
	Write-Host "  Attempt $attempt/$maxAttempts - API not ready..." -ForegroundColor Gray
	Start-Sleep -Seconds 5
}

if (-not $apiHealthy) {
	Write-Host "ERROR: API failed to become healthy after $maxAttempts attempts." -ForegroundColor Red
	if (-not $KeepRunning) {
		docker compose -f docker-compose.loadtest.yml down
	}
	Pop-Location
	exit 1
}

Write-Host "API is healthy!" -ForegroundColor Green

# 5. Run k6 scenarios
Write-Host ""
Write-Host "Running k6 load tests (profile: $Profile)..." -ForegroundColor Cyan
$exitCode = 0

# k6 writes INFO log lines to stderr (e.g. k6-reporter notifications).
# PS 5.1 with $ErrorActionPreference = 'Stop' treats native-command stderr as
# terminating errors, which would abort the script when invoked via
# `powershell -File`. Switch to 'Continue' for the k6 section so stderr is
# still displayed but does not terminate the script.
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
	k6 run -q --env PROFILE=$Profile $scenarioPath 2>&1 | ForEach-Object { "$_" }
	if ($LASTEXITCODE -ne 0) { $exitCode = 1 }
}
else {
	# Run all scenarios
	$scenarioFiles = Get-ChildItem -Path "scenarios" -Recurse -Filter "*.test.js"
	foreach ($file in $scenarioFiles) {
		$relativePath = $file.FullName.Substring($LoadTestRoot.Length + 1).Replace("\", "/")
		Write-Host "  Running: $relativePath" -ForegroundColor White
		k6 run -q --env PROFILE=$Profile $relativePath 2>&1 | ForEach-Object { "$_" }
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

# 6. Generate summary report
Write-Host ""
Write-Host "Generating summary report..." -ForegroundColor Cyan
node (Join-Path $LoadTestRoot "scripts\generate-summary.js")

# 7. Open summary in browser
$summaryPath = Join-Path $LoadTestRoot "reports\summary.html"
if (Test-Path $summaryPath) {
	Write-Host "Opening summary report..." -ForegroundColor Cyan
	Start-Process $summaryPath
}

# 8. Stop containers (unless -KeepRunning)
if (-not $KeepRunning) {
	Write-Host ""
	Write-Host "Stopping load test environment..." -ForegroundColor Cyan
	Push-Location $RepoRoot
	docker compose -f docker-compose.loadtest.yml down
	Pop-Location
}
else {
	Write-Host ""
	Write-Host "Environment left running (-KeepRunning specified)." -ForegroundColor Yellow
	Write-Host "Stop manually: docker compose -f docker-compose.loadtest.yml down" -ForegroundColor Yellow
}


Write-Host ""
if ($exitCode -eq 0) {
	Write-Host "All load tests PASSED!" -ForegroundColor Green
}
else {
	Write-Host "Some load tests FAILED. Check reports for details." -ForegroundColor Red
}

exit $exitCode
