#Requires -Version 7.4
<#
.SYNOPSIS
    SeventySix One-Command Bootstrap — sets up the entire development environment.
.DESCRIPTION
    Detects/installs prerequisites, collects secrets, generates certificates,
    installs dependencies, and optionally runs all test suites.
.NOTES
    === WHERE TO START ===
    Windows:                   .\scripts\bootstrap.cmd   (installs pwsh via winget, then calls this)
    Linux / macOS / Codespace: bash scripts/bootstrap.sh (installs pwsh via apt/brew, then calls this)
    After pwsh is installed:   pwsh -ExecutionPolicy Bypass -File scripts/bootstrap.ps1

    On a GitHub Codespace, always start with:  bash scripts/bootstrap.sh
#>
[CmdletBinding()]
param(
	[switch]$SkipTests
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
& "$PSScriptRoot\generate-internal-ca.ps1"
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

# Install sandbox dependencies (SeventySixCommerce SvelteKit and TanStack)
Write-Host "  Installing SeventySixCommerce SvelteKit dependencies..." -ForegroundColor Cyan
Push-Location (Join-Path $repoRoot "ECommerce" "seventysixcommerce-sveltekit")
& npm ci
if ($LASTEXITCODE -ne 0) { Write-Error "SvelteKit npm ci failed."; exit 1 }
Pop-Location

Write-Host "  Installing SeventySixCommerce TanStack dependencies..." -ForegroundColor Cyan
Push-Location (Join-Path $repoRoot "ECommerce" "seventysixcommerce-tanstack")
& npm ci --legacy-peer-deps
if ($LASTEXITCODE -ne 0) { Write-Error "TanStack npm ci failed."; exit 1 }
Pop-Location

# Commerce secrets are now managed via .NET user-secrets (set during collect-secrets.ps1 above).
# No .env.local files are needed — start scripts load secrets via load-commerce-secrets.mjs.
Write-Host ""
Write-Host "  Commerce secrets configured via user-secrets (run 'npm run secrets:list' to view)." -ForegroundColor Green

# Install dprint globally if not already present
# dprint is required for 'npm run format' (ESLint → dprint → ESLint pipeline).
Write-Host "  Checking dprint..."
$dprintCmd = Get-Command dprint -ErrorAction SilentlyContinue
if (-not $dprintCmd) {
	Write-Host "  dprint not found — installing..." -ForegroundColor Yellow
	if ($IsWindows) {
		if (Get-Command winget -ErrorAction SilentlyContinue) {
			& winget install dprint.dprint --accept-source-agreements --accept-package-agreements
		}
		else {
			# Fallback: PowerShell install script from dprint.dev
			Invoke-Expression ((Invoke-WebRequest -Uri 'https://dprint.dev/install.ps1' -UseBasicParsing).Content)
		}
	}
	else {
		# Linux / macOS
		& bash -c "curl -fsSL https://dprint.dev/install.sh | sh"
		# Add ~/.dprint/bin to PATH for the remainder of this bootstrap session
		$dprintBin = Join-Path $env:HOME ".dprint" "bin"
		if (Test-Path $dprintBin) {
			$env:PATH = "${dprintBin}$([System.IO.Path]::PathSeparator)$env:PATH"
		}
	}
	$dprintCmd = Get-Command dprint -ErrorAction SilentlyContinue
	if ($dprintCmd) {
		Write-Host "  [OK] dprint installed: $(& dprint --version)" -ForegroundColor Green
	}
	else {
		Write-Host "  [WARN] dprint installed but not yet on PATH." -ForegroundColor Yellow
		Write-Host "         Restart your terminal or add ~/.dprint/bin to your PATH." -ForegroundColor Yellow
	}
}
else {
	$dprintVersion = & dprint --version 2>$null
	Write-Host "  [OK] dprint already installed: $dprintVersion" -ForegroundColor Green
}

# Install k6 if not already present
# k6 is required for load testing (npm run loadtest:quick, etc.)
Write-Host "  Checking k6..."
$k6Cmd = Get-Command k6 -ErrorAction SilentlyContinue
if (-not $k6Cmd) {
	Write-Host "  k6 not found — installing..." -ForegroundColor Yellow
	if ($IsWindows) {
		if (Get-Command winget -ErrorAction SilentlyContinue) {
			& winget install Grafana.k6 --accept-source-agreements --accept-package-agreements
		}
		else {
			Write-Host "  [WARN] winget not available. Install k6 manually:" -ForegroundColor Yellow
			Write-Host "         https://grafana.com/docs/k6/latest/set-up/install-k6/" -ForegroundColor Yellow
		}
	}
	else {
		# Linux / macOS — use official Grafana gpg key + apt repo
		& bash -c "sudo gpg -k 2>/dev/null; curl -fsSL https://dl.grafana.com/oss/gpg.key | sudo gpg --dearmor -o /usr/share/keyrings/k6-archive-keyring.gpg && echo 'deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.grafana.com/oss/deb stable main' | sudo tee /etc/apt/sources.list.d/grafana_k6.list && sudo apt-get update -q && sudo apt-get install -y k6"
	}
	$k6Cmd = Get-Command k6 -ErrorAction SilentlyContinue
	if ($k6Cmd) {
		Write-Host "  [OK] k6 installed: $(& k6 version)" -ForegroundColor Green
	}
	else {
		Write-Host "  [WARN] k6 install may require a terminal restart." -ForegroundColor Yellow
	}
}
else {
	$k6Version = & k6 version 2>$null
	Write-Host "  [OK] k6 already installed: $k6Version" -ForegroundColor Green
}

# Install Playwright browsers for E2E testing
# Only chromium is needed — E2E specs target Chromium/Chrome
Write-Host "  Installing Playwright browsers (chromium)..."
Push-Location $repoRoot
& npx playwright install --with-deps chromium
$playwrightExit = $LASTEXITCODE
Pop-Location
if ($playwrightExit -ne 0) {
	Write-Host "  [WARN] Playwright browser install had issues. E2E tests may not work." -ForegroundColor Yellow
}
else {
	Write-Host "  [OK] Playwright browsers installed." -ForegroundColor Green
}

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

	Write-Host ""
	Write-Host "--- SeventySixCommerce SvelteKit Tests (npm test) ---" -ForegroundColor Cyan
	# Link shared module resolution before commerce tests — ensures shared TS imports resolve correctly
	Write-Host "  Linking shared modules for SvelteKit..."
	Push-Location $repoRoot
	& node scripts/link-commerce-shared-node-modules.mjs --app sveltekit
	if ($LASTEXITCODE -ne 0) {
		Write-Host "  [WARN] SvelteKit shared module linking failed." -ForegroundColor Yellow
	}
	Pop-Location
	Push-Location (Join-Path $repoRoot "ECommerce" "seventysixcommerce-sveltekit")
	& npm run test
	$svelteTestExit = $LASTEXITCODE
	Pop-Location
	if ($svelteTestExit -ne 0) {
		Write-Host "[FAIL] SvelteKit tests failed. Check output above." -ForegroundColor Red
		exit 1
	}
	Write-Host "  [PASS] SvelteKit tests passed." -ForegroundColor Green

	Write-Host ""
	Write-Host "--- SeventySixCommerce TanStack Tests (npm test) ---" -ForegroundColor Cyan
	# Link shared module resolution before TanStack tests
	Write-Host "  Linking shared modules for TanStack..."
	Push-Location $repoRoot
	& node scripts/link-commerce-shared-node-modules.mjs --app tanstack
	if ($LASTEXITCODE -ne 0) {
		Write-Host "  [WARN] TanStack shared module linking failed." -ForegroundColor Yellow
	}
	Pop-Location
	Push-Location (Join-Path $repoRoot "ECommerce" "seventysixcommerce-tanstack")
	& npm run test
	$tanstackTestExit = $LASTEXITCODE
	Pop-Location
	if ($tanstackTestExit -ne 0) {
		Write-Host "[FAIL] TanStack tests failed. Check output above." -ForegroundColor Red
		exit 1
	}
	Write-Host "  [PASS] TanStack tests passed." -ForegroundColor Green
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

	$dprintVersion = "unknown"
	try { $dprintVersion = (& dprint --version 2>$null) } catch { }
	$k6Version = "unknown"
	try { $k6Version = (& k6 version 2>$null) } catch { }

	Write-Host "    .NET SDK:      $dotnetVersion"
	Write-Host "    Node.js:       $nodeVersion"
	Write-Host "    npm:           $npmVersion"
	Write-Host "    Docker:        $dockerVersion"
	Write-Host "    Angular CLI:   $ngVersion"
	Write-Host "    dprint:        $dprintVersion"
	Write-Host "    k6:            $k6Version"
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

	# --- Critical notice if Brevo SMTP was not configured ---
	$emailApiKey = $env:EMAIL_API_KEY
	if ([string]::IsNullOrWhiteSpace($emailApiKey) -or $emailApiKey -eq "PLACEHOLDER_USE_USER_SECRETS") {
		Write-Host ""
		Write-Host "========================================" -ForegroundColor Red
		Write-Host "  CRITICAL: No Email Provider Configured" -ForegroundColor Red
		Write-Host "========================================" -ForegroundColor Red
		Write-Host ""
		Write-Host "  You skipped Brevo SMTP setup. MFA email codes CANNOT be delivered." -ForegroundColor Yellow
		Write-Host "  Without email delivery, users will be blocked at the MFA verification step." -ForegroundColor Yellow
		Write-Host ""
		Write-Host "  ACTION REQUIRED — disable MFA and TOTP for local development:" -ForegroundColor Red
		Write-Host "  File: SeventySix.Server/SeventySix.Api/appsettings.Development.json" -ForegroundColor White
		Write-Host ""
		Write-Host '  Change these values:' -ForegroundColor White
		Write-Host '    "Mfa":  { "Enabled": false, "RequiredForAllUsers": false }' -ForegroundColor Yellow
		Write-Host '    "Totp": { "Enabled": false }' -ForegroundColor Yellow
		Write-Host ""
		Write-Host "  Tip: appsettings.Development.json already has a comment block showing exactly" -ForegroundColor Cyan
		Write-Host "  which keys to change. Search for '_comment_minimal_setup' in that file." -ForegroundColor Cyan
		Write-Host ""
	}

	# --- Seeded admin credentials — ALWAYS shown in plain text, save before closing ---
	$seedEmail = if ($env:ADMIN_EMAIL) { $env:ADMIN_EMAIL } else { "(see AdminSeeder:Email in user-secrets)" }
	$seedPassword = if ($env:ADMIN_PASSWORD) { $env:ADMIN_PASSWORD } else { "(see AdminSeeder:InitialPassword in user-secrets)" }

	Write-Host ""
	Write-Host "========================================" -ForegroundColor Magenta
	Write-Host "  SAVE THESE CREDENTIALS NOW" -ForegroundColor Magenta
	Write-Host "========================================" -ForegroundColor Magenta
	Write-Host ""
	Write-Host "  Seeded admin account for local development:" -ForegroundColor White
	Write-Host "    Username : admin" -ForegroundColor Green
	Write-Host "    Email    : $seedEmail" -ForegroundColor Green
	Write-Host "    Password : $seedPassword" -ForegroundColor Green
	Write-Host ""
	Write-Host "  These values are stored only in .NET user-secrets — never committed to git." -ForegroundColor Yellow
	Write-Host "  Save them in a password manager or secure note before closing this terminal." -ForegroundColor Yellow
	Write-Host ""
	Read-Host "  Press Enter once you have saved these credentials"
}

Write-VersionSummary

# Phase 9: Next steps
Write-Host ""
Write-Host "  Run 'npm run start' in the terminal to launch your local instance." -ForegroundColor Green
Write-Host ""
