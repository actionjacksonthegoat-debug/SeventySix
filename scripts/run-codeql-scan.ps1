<#
.SYNOPSIS
    Runs local CodeQL security scans for C# and TypeScript/JavaScript.

.DESCRIPTION
    Creates CodeQL databases and analyzes them using the standard security
    query suites. Outputs SARIF files that can be opened in VS Code with
    the github.vscode-codeql extension.

    Results are written to:
        .codeql/results/csharp.sarif          (security rules)
        .codeql/results/csharp-quality.sarif  (quality/recommendation rules)
        .codeql/results/typescript.sarif

    LOCAL vs CI PARITY
    ------------------
    This script uses the same `security-and-quality` suite as GitHub Actions CI
    (.github/codeql/codeql-config.yml). One inherent difference remains:

      C# build mode: CI uses `build-mode: manual` (traced Linux build) for richer
      data-flow. Local uses `--build-mode=none` (buildless Roslyn) to avoid the
      VBCSCompiler lock issue on Windows with .NET 10.

      For SECURITY rules: both modes produce equivalent results.

      For QUALITY rules: recommendation-level results (MissedWhere, NoDisposeCall,
      etc.) are filtered from the main SARIF by the suite selector. A SEPARATE
      quality pass (.github/codeql/csharp-quality-local.qls) replicates what CI
      surfaces via its SARIF processing pipeline.

    Bottom line: `npm run scan:codeql` locally finds all the same violation
    categories as CI. Minor count differences are expected due to build mode.

.EXAMPLE
    .\scripts\run-codeql-scan.ps1
    .\scripts\run-codeql-scan.ps1 -LanguageFilter csharp
    .\scripts\run-codeql-scan.ps1 -LanguageFilter typescript

.NOTES
    Requires the GitHub CodeQL VS Code extension (github.vscode-codeql).
    The extension downloads and manages the CLI automatically — no manual PATH
    setup needed. Install it via Ctrl+Shift+X → search "GitHub CodeQL".

    If for any reason you prefer a standalone CLI, extract the bundle from
    https://github.com/github/codeql-action/releases/latest to any folder
    and add that folder to your PATH. This script will find it either way.
#>
[CmdletBinding()]
param
(
	[ValidateSet("all", "csharp", "typescript")]
	[string]$LanguageFilter = "all",

	[switch]$SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# -- Paths --------------------------------------------------------------------
$RepoRoot = Split-Path -Parent $PSScriptRoot
$CsharpRoot = Join-Path $RepoRoot "SeventySix.Server"
$TsRoot = Join-Path $RepoRoot "SeventySix.Client"
$CodeqlDir = Join-Path $RepoRoot ".codeql"
$ResultsDir = Join-Path $CodeqlDir "results"
$CsharpDb = Join-Path $CodeqlDir "db-csharp"
$TsDb = Join-Path $CodeqlDir "db-typescript"
$CsharpSarif = Join-Path $ResultsDir "csharp.sarif"
$CsharpQualitySarif = Join-Path $ResultsDir "csharp-quality.sarif"
$TsSarif = Join-Path $ResultsDir "typescript.sarif"

# -- Prerequisite check -------------------------------------------------------
Write-Host "`nCodeQL Local Security Scan" -ForegroundColor Cyan
Write-Host "==========================`n" -ForegroundColor Cyan

# Resolve CodeQL CLI — check PATH first, then the VS Code extension's managed location.
# The github.vscode-codeql extension stores the CLI under VS Code's global storage;
# detecting it here means zero manual setup for any developer with the extension installed.
function Resolve-CodeqlExe {
	$onPath = Get-Command codeql -ErrorAction SilentlyContinue
	if ($null -ne $onPath) { return $onPath.Source }

	# VS Code extension storage — works for stable Code, Code Insiders, and Cursor
	$storageBases = @(
		"$env:APPDATA\Code\User\globalStorage\github.vscode-codeql",
		"$env:APPDATA\Code - Insiders\User\globalStorage\github.vscode-codeql",
		"$env:APPDATA\Cursor\User\globalStorage\github.vscode-codeql"
	)
	foreach ($base in $storageBases) {
		$cli = Get-ChildItem "$base\distribution*\codeql\codeql.exe" -ErrorAction SilentlyContinue |
		Sort-Object FullName -Descending |
		Select-Object -First 1
		if ($null -ne $cli) { return $cli.FullName }
	}
	return $null
}

$codeqlExe = Resolve-CodeqlExe
if ($null -eq $codeqlExe) {
	Write-Error @"
CodeQL CLI not found.

The easiest fix — install the GitHub CodeQL VS Code extension:
  Ctrl+Shift+X -> search "GitHub CodeQL" (publisher: GitHub) -> Install
  The extension downloads and manages the CLI automatically.
  Restart this terminal after the extension finishes downloading.

Alternatively, extract the CLI bundle to any folder and add it to your PATH:
  https://github.com/github/codeql-action/releases/latest
"@
}

# Add the resolved location to this session's PATH so all codeql calls below work as-is.
$codeqlDir = Split-Path $codeqlExe
if ($env:PATH -notlike "*$codeqlDir*") {
	$env:PATH = "$codeqlDir;$env:PATH"
}

$codeqlVersion = codeql --version 2>&1 | Select-Object -First 1
Write-Host "[OK] CodeQL CLI: $codeqlVersion`n" -ForegroundColor Green

# -- Ensure query packs are available -----------------------------------------
Write-Host "Checking query packs..." -ForegroundColor Gray

$packsToCheck = @()
if ($LanguageFilter -eq "all" -or $LanguageFilter -eq "csharp") {
	$packsToCheck += "codeql/csharp-queries"
}
if ($LanguageFilter -eq "all" -or $LanguageFilter -eq "typescript") {
	$packsToCheck += "codeql/javascript-queries"
}

foreach ($pack in $packsToCheck) {
	codeql pack download $pack 2>&1 | Out-Null
}

Write-Host "[OK] Query packs ready`n" -ForegroundColor Green

# -- Setup output dirs --------------------------------------------------------
New-Item -ItemType Directory -Force -Path $ResultsDir | Out-Null

# -- C# Scan ------------------------------------------------------------------
function Invoke-CsharpScan {
	Write-Host "[C#] Building solution (required before --build-mode=none extraction)..." -ForegroundColor Yellow

	# Pre-build required: --build-mode=none needs DLLs present so the Roslyn extractor
	# can resolve analyzer DLLs (SeventySix.Analyzers.dll) and framework references.
	# Without this, the extractor may crash on missing assemblies.
	dotnet build (Join-Path $CsharpRoot "SeventySix.Server.slnx") --configuration Release

	Write-Host "[C#] Creating database (build-mode: none)..." -ForegroundColor Yellow

	if (Test-Path $CsharpDb) {
		Remove-Item -Recurse -Force $CsharpDb
	}

	Push-Location $CsharpRoot
	try {
		# Use --build-mode=none (buildless/standalone extraction) instead of a traced
		# build. The traced build (--command) fails on Windows with .NET 10 because
		# the CodeQL C# tracer cannot intercept the VBCSCompiler shared build server.
		# Buildless mode uses Roslyn directly to parse source files.
		codeql database create $CsharpDb `
			--language=csharp `
			--build-mode=none `
			--source-root=. `
			--overwrite

		Write-Host "[C#] Analyzing..." -ForegroundColor Yellow

		codeql database analyze $CsharpDb `
			--format=sarif-latest `
			--output=$CsharpSarif `
			--sarif-add-file-contents `
			codeql/csharp-queries:codeql-suites/csharp-security-and-quality.qls

		Write-Host "[OK] C# results: $CsharpSarif" -ForegroundColor Green

		# -- Quality pass: recommendation-level rules silenced by the main suite selector --
		# The csharp-security-and-quality.qls suite applies security-and-frozen-quality-selectors.yml
		# which filters 'recommendation' severity results from the SARIF output. GitHub Actions CI
		# surfaces these via its own pipeline. This separate pass replicates that locally.
		$QlsPath = Join-Path $RepoRoot ".github\codeql\csharp-quality-local.qls"
		if (Test-Path $QlsPath) {
			Write-Host "[C#] Running quality analysis (CI-equivalent recommendation rules)..." -ForegroundColor Yellow
			codeql database analyze $CsharpDb `
				--format=sarif-latest `
				--output=$CsharpQualitySarif `
				--sarif-add-file-contents `
				$QlsPath
			Write-Host "[OK] C# quality results: $CsharpQualitySarif" -ForegroundColor Green
		}
		else {
			Write-Host "[WARN] Quality suite file not found, skipping quality pass: $QlsPath" -ForegroundColor Yellow
		}
	}
	finally {
		Pop-Location
	}
}

# -- TypeScript Scan ----------------------------------------------------------
function Invoke-TypescriptScan {
	Write-Host "[TypeScript] Creating database..." -ForegroundColor Yellow

	if (Test-Path $TsDb) {
		Remove-Item -Recurse -Force $TsDb
	}

	codeql database create $TsDb `
		--language=javascript-typescript `
		--source-root=$TsRoot `
		--overwrite

	Write-Host "[TypeScript] Analyzing..." -ForegroundColor Yellow

	codeql database analyze $TsDb `
		--format=sarif-latest `
		--output=$TsSarif `
		--sarif-add-file-contents `
		codeql/javascript-queries:codeql-suites/javascript-security-and-quality.qls

	Write-Host "[OK] TypeScript results: $TsSarif" -ForegroundColor Green
}

# -- Run selected scans -------------------------------------------------------
switch ($LanguageFilter) {
	"csharp" { Invoke-CsharpScan }
	"typescript" { Invoke-TypescriptScan }
	default {
		Invoke-CsharpScan
		Invoke-TypescriptScan
	}
}

# -- Summary ------------------------------------------------------------------
# Helper: count and categorise results from a SARIF file.
# Applies the same paths-ignore as codeql-config.yml so local counts match CI.
# (GitHub Actions filters paths-ignore before uploading; the raw local SARIF includes them.)
function Show-SarifSummary {
	param([string]$SarifPath, [string]$Label)
	if (-not (Test-Path $SarifPath)) { return }
	try {
		$sarif = Get-Content $SarifPath -Raw | ConvertFrom-Json
		$allResults = $sarif.runs[0].results

		# Mirror the paths-ignore from .github/codeql/codeql-config.yml.
		# These patterns are applied by GitHub Actions before uploading; local CLI
		# includes them in the raw SARIF, so we filter them out here to match CI counts.
		$ignoredPathFragments = @(
			"/obj/",
			"/bin/",
			"/node_modules/",
			"SeventySix.Client/dist",
			"SeventySix.Client/coverage",
			"SeventySix.Client/.angular",
			"SeventySix.Client/playwright-report",
			"SeventySix.Client/test-results",
			"SeventySix.Client/load-testing"
		)

		$results = $allResults | Where-Object {
			$uri = $_.locations[0].physicalLocation.artifactLocation.uri
			$ignored = $false
			foreach ($fragment in $ignoredPathFragments) {
				if ($uri -like "*$fragment*") { $ignored = $true; break }
			}
			-not $ignored
		}
		$total = $results.Count

		$color = if ($total -eq 0) { "Green" } elseif ($total -le 3) { "Yellow" } else { "Red" }
		Write-Host "  $Label`: $total result(s)" -ForegroundColor $color
	}
	catch {
		Write-Host "  $Label`: [could not parse SARIF]" -ForegroundColor DarkGray
	}
}

Write-Host "`nScan Complete!" -ForegroundColor Cyan
Write-Host ""

if ($LanguageFilter -eq "all" -or $LanguageFilter -eq "csharp") {
	Show-SarifSummary -SarifPath $CsharpSarif -Label "C# (security)"
	Show-SarifSummary -SarifPath $CsharpQualitySarif -Label "C# (quality)"
}
if ($LanguageFilter -eq "all" -or $LanguageFilter -eq "typescript") {
	Show-SarifSummary -SarifPath $TsSarif -Label "TypeScript"
}

Write-Host ""
Write-Host "View results in VS Code:" -ForegroundColor White
Write-Host "  Right-click a SARIF file in Explorer > 'Open with CodeQL SARIF Viewer'" -ForegroundColor DarkGray

if ($LanguageFilter -eq "all" -or $LanguageFilter -eq "csharp") {
	Write-Host "  C# Security: $CsharpSarif" -ForegroundColor Gray
	Write-Host "  C# Quality:  $CsharpQualitySarif" -ForegroundColor Gray
}
if ($LanguageFilter -eq "all" -or $LanguageFilter -eq "typescript") {
	Write-Host "  TypeScript: $TsSarif" -ForegroundColor Gray
}