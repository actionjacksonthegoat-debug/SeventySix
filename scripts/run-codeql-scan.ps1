<#
.SYNOPSIS
    Runs local CodeQL security scans for C# and TypeScript/JavaScript.

.DESCRIPTION
    Creates CodeQL databases and analyzes them using the standard security
    query suites. Outputs SARIF files that can be opened in VS Code with
    the github.vscode-codeql extension.

    Results are written to:
        .codeql/results/csharp.sarif
        .codeql/results/typescript.sarif

.EXAMPLE
    .\scripts\run-codeql-scan.ps1
    .\scripts\run-codeql-scan.ps1 -LanguageFilter csharp
    .\scripts\run-codeql-scan.ps1 -LanguageFilter typescript

.NOTES
    Requires CodeQL CLI on PATH. See implementation-2.md Phase 2-2 for setup.
    The VS Code github.vscode-codeql extension can also install the CLI:
    Ctrl+Shift+P -> CodeQL: Install CLI
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
$TsSarif = Join-Path $ResultsDir "typescript.sarif"

# -- Prerequisite check -------------------------------------------------------
Write-Host "`nCodeQL Local Security Scan" -ForegroundColor Cyan
Write-Host "==========================`n" -ForegroundColor Cyan

$codeqlCmd = Get-Command codeql -ErrorAction SilentlyContinue
if ($null -eq $codeqlCmd) {
	Write-Error @"
CodeQL CLI not found on PATH.

Setup instructions:
  1. Download CodeQL CLI bundle from:
     https://github.com/github/codeql-action/releases/latest
  2. Extract to: $env:USERPROFILE\.codeql\codeql-cli
  3. Add the extracted folder to your PATH

Alternatively, the VS Code github.vscode-codeql extension can install
the CLI for you: Ctrl+Shift+P > CodeQL: Install CLI
"@
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
			codeql/csharp-queries:codeql-suites/csharp-code-scanning.qls

		Write-Host "[OK] C# results: $CsharpSarif" -ForegroundColor Green
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
		codeql/javascript-queries:codeql-suites/javascript-code-scanning.qls

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
Write-Host "`nScan Complete!" -ForegroundColor Cyan
Write-Host "Open results in VS Code:" -ForegroundColor White
Write-Host "  Ctrl+Shift+P > CodeQL: Open SARIF File" -ForegroundColor White

if ($LanguageFilter -eq "all" -or $LanguageFilter -eq "csharp") {
	Write-Host "  C#:         $CsharpSarif" -ForegroundColor Gray
}

if ($LanguageFilter -eq "all" -or $LanguageFilter -eq "typescript") {
	Write-Host "  TypeScript: $TsSarif" -ForegroundColor Gray
}

Write-Host "`nTip: Right-click a SARIF file in VS Code Explorer > 'Open with CodeQL SARIF Viewer'" -ForegroundColor DarkGray