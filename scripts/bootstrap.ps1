#Requires -Version 7.4
<#
.SYNOPSIS
    SeventySix One-Command Bootstrap — sets up the entire development environment.
.DESCRIPTION
    Detects/installs prerequisites, collects secrets, generates certificates,
    installs dependencies, and optionally runs all test suites.
.NOTES
    Run from the repository root: .\scripts\bootstrap.ps1
    Or via: npm run bootstrap (after Node.js is available)
#>
[CmdletBinding()]
param(
	[switch]$SkipTests,
	[switch]$SkipStart
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "========================================"
Write-Host "  SeventySix Developer Bootstrap"
Write-Host "  One command. Full environment."
Write-Host "========================================"
Write-Host ""

# Phase 1: Prerequisites
& "$PSScriptRoot\internal\check-prerequisites.ps1"
if ($LASTEXITCODE -ne 0) { exit 1 }

# Phase 2: Secrets collection
& "$PSScriptRoot\internal\collect-secrets.ps1"
if ($LASTEXITCODE -ne 0) { exit 1 }

# Phase 3: Export secrets as env vars — required by cert generation scripts
& "$PSScriptRoot\internal\load-user-secrets.ps1"
if ($LASTEXITCODE -ne 0) { exit 1 }

# Phase 4: Certificate generation (reads DATA_PROTECTION_CERTIFICATE_PASSWORD from env)
& "$PSScriptRoot\generate-dev-ssl-cert.ps1"
if ($LASTEXITCODE -ne 0) { exit 1 }
& "$PSScriptRoot\generate-dataprotection-cert.ps1"
if ($LASTEXITCODE -ne 0) { exit 1 }

# Phase 5: Install dependencies
Write-Host ""
Write-Host "--- Installing Dependencies ---" -ForegroundColor Cyan

Push-Location $repoRoot
Write-Host "  Running npm install (root + client)..."
& npm install
if ($LASTEXITCODE -ne 0) { Write-Error "npm install failed."; exit 1 }
Pop-Location

Push-Location (Join-Path $repoRoot "SeventySix.Server")
Write-Host "  Running dotnet restore..."
& dotnet restore
if ($LASTEXITCODE -ne 0) { Write-Error "dotnet restore failed."; exit 1 }
Pop-Location

# Phase 6: Build verification
Write-Host ""
Write-Host "--- Build Verification ---" -ForegroundColor Cyan

Push-Location (Join-Path $repoRoot "SeventySix.Server")
Write-Host "  Building .NET server..."
& dotnet build --configuration Release --no-restore
if ($LASTEXITCODE -ne 0) { Write-Error "Server build failed. Check the errors above."; exit 1 }
Write-Host "  [OK] Server build succeeded."
Pop-Location

Push-Location (Join-Path $repoRoot "SeventySix.Client")
Write-Host "  Building Angular client..."
& npx ng build --configuration development
if ($LASTEXITCODE -ne 0) { Write-Error "Client build failed. Check the errors above."; exit 1 }
Write-Host "  [OK] Client build succeeded."
Pop-Location

# Phase 7: Test execution (unless skipped)
if (-not $SkipTests) {
	Write-Host ""
	Write-Host "========================================" -ForegroundColor Yellow
	Write-Host "  Running All Test Suites" -ForegroundColor Yellow
	Write-Host "========================================" -ForegroundColor Yellow

	Write-Host ""
	Write-Host "--- Server Tests (dotnet test) ---" -ForegroundColor Cyan
	Push-Location (Join-Path $repoRoot "SeventySix.Server")
	& dotnet test --no-build --configuration Release
	$serverTestExit = $LASTEXITCODE
	Pop-Location
	if ($serverTestExit -ne 0) {
		Write-Host "[FAIL] Server tests failed. Check output above." -ForegroundColor Red
		exit 1
	}
	Write-Host "  [PASS] Server tests passed." -ForegroundColor Green

	Write-Host ""
	Write-Host "--- Client Tests (npm test) ---" -ForegroundColor Cyan
	Push-Location $repoRoot
	& npm run test:client
	$clientTestExit = $LASTEXITCODE
	Pop-Location
	if ($clientTestExit -ne 0) {
		Write-Host "[FAIL] Client tests failed. Check output above." -ForegroundColor Red
		exit 1
	}
	Write-Host "  [PASS] Client tests passed." -ForegroundColor Green

	# E2E and load tests run in parallel since they use different Docker ports
	Write-Host ""
	Write-Host "--- E2E & Load Tests (parallel, Docker-isolated) ---" -ForegroundColor Cyan

	$e2eJob = Start-Job -ScriptBlock {
		Set-Location $using:repoRoot
		& npm run test:e2e 2>&1
		exit $LASTEXITCODE
	}

	$loadJob = Start-Job -ScriptBlock {
		Set-Location $using:repoRoot
		& npm run loadtest:quick 2>&1
		exit $LASTEXITCODE
	}

	$e2eOutput = Receive-Job -Job $e2eJob -Wait
	$e2eWasFailed = $e2eJob.State -eq 'Failed'
	Remove-Job -Job $e2eJob -Force

	$loadOutput = Receive-Job -Job $loadJob -Wait
	$loadWasFailed = $loadJob.State -eq 'Failed'
	Remove-Job -Job $loadJob -Force

	if ($e2eWasFailed -or ($e2eOutput -match '\[FAIL\]|\bfailed\b')) {
		$e2eExitCode = 1
	}
	else {
		$e2eExitCode = 0
	}

	if ($loadWasFailed -or ($loadOutput -match '\[FAIL\]|\bfailed\b')) {
		$loadExitCode = 1
	}
	else {
		$loadExitCode = 0
	}

	Write-Host ""
	Write-Host "--- E2E Test Results ---"
	Write-Host $e2eOutput
	Write-Host ""
	Write-Host "--- Load Test Results ---"
	Write-Host $loadOutput

	if ($e2eExitCode -ne 0) {
		Write-Host "[FAIL] E2E tests failed. Check output above." -ForegroundColor Red
		exit 1
	}
	Write-Host "  [PASS] E2E tests passed." -ForegroundColor Green

	if ($loadExitCode -ne 0) {
		Write-Host "[FAIL] Load tests failed. Check output above." -ForegroundColor Red
		exit 1
	}
	Write-Host "  [PASS] Load tests passed." -ForegroundColor Green
}

# Phase 8: Version summary
function Write-VersionSummary {
	Write-Host ""
	Write-Host "========================================" -ForegroundColor Green
	Write-Host "  Bootstrap Complete!" -ForegroundColor Green
	Write-Host "========================================" -ForegroundColor Green
	Write-Host ""
	Write-Host "  Installed/verified versions:"

	function Get-VersionOrUnknown {
		param([string[]]$Cmd)
		try {
			$r = & $Cmd[0] $Cmd[1..($Cmd.Count - 1)] 2>$null
			if ($r) { $r }
			else { "unknown" }
		}
		catch { "unknown" }
	}

	$dotnetVersion = Get-VersionOrUnknown "dotnet", "--version"
	$nodeVersion = Get-VersionOrUnknown "node", "--version"
	$npmVersion = Get-VersionOrUnknown "npm", "--version"
	$dockerVersion = Get-VersionOrUnknown "docker", "--version"
	$ngVersion = "unknown"
	try {
		Push-Location (Join-Path $repoRoot "SeventySix.Client")
		$ngOut = & npx ng version 2>$null
		$ngLine = $ngOut | Select-String "Angular CLI:"
		if ($ngLine) { $ngVersion = $ngLine.ToString().Trim() }
		Pop-Location
	}
	catch { Pop-Location }

	Write-Host "    .NET SDK:      $dotnetVersion"
	Write-Host "    Node.js:       $nodeVersion"
	Write-Host "    npm:           $npmVersion"
	Write-Host "    Docker:        $dockerVersion"
	Write-Host "    Angular CLI:   $ngVersion"
	Write-Host ""
	Write-Host "  # Version Comment Block (for regression tracking)"
	Write-Host "  # Bootstrap completed: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
	Write-Host "  # .NET SDK: $dotnetVersion"
	Write-Host "  # Node.js: $nodeVersion"
	Write-Host "  # npm: $npmVersion"
	Write-Host "  # Docker: $dockerVersion"
	Write-Host "  # Angular CLI: $ngVersion"
	Write-Host "  # PostgreSQL: 18-alpine (Docker image)"
	Write-Host "  # Valkey: 9.0-alpine (Docker image)"
	Write-Host ""
	Write-Host "  Hardcoded LTS versions used in codebase:" -ForegroundColor Yellow
	Write-Host "    .NET SDK: 10.0.100"
	Write-Host "    Node.js: 22.x LTS"
	Write-Host "    Angular: 21.1.x"
	Write-Host "    PostgreSQL: 18-alpine"
	Write-Host "    Valkey: 9.0-alpine"
	Write-Host "    Grafana: 11.4.0"
	Write-Host "    Prometheus: v2.54.1"
	Write-Host "    Jaeger: 1.62.0"
	Write-Host "    k6: latest"
	Write-Host ""

	if (-not $SkipStart) {
		Write-Host "  To start developing:" -ForegroundColor Cyan
		Write-Host "    npm start" -ForegroundColor White
		Write-Host ""
		Write-Host "  Seeded admin credentials (from your user-secrets):" -ForegroundColor Cyan
		Write-Host "    Username: admin" -ForegroundColor White
		Write-Host "    Email: (as entered during setup)" -ForegroundColor White
		Write-Host "    Password: (as entered during setup)" -ForegroundColor White
		Write-Host ""
	}
}

Write-VersionSummary

# Phase 9: Offer to start
if (-not $SkipStart) {
	$startNow = Read-Host "Start the development environment now? (y/N)"
	if ($startNow -match '^[yY]') {
		& "$PSScriptRoot\start-dev.ps1"
	}
}
