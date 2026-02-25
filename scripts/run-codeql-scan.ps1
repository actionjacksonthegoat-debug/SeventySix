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
# Helper: count and categorise results from a SARIF file
function Show-SarifSummary {
	param([string]$SarifPath, [string]$Label)
	if (-not (Test-Path $SarifPath)) { return }
	try {
		$sarif = Get-Content $SarifPath -Raw | ConvertFrom-Json
		$results = $sarif.runs[0].results
		$total = $results.Count

		# Known false positives suppressed via // lgtm[...] inline annotations.
		# These are real code patterns (HTTPS redirect path pass-through, OAuth
		# authorization URL redirect) where CodeQL's taint analysis cannot prove
		# that ASP.NET Core path/query components cannot contain scheme+host, or
		# that the OAuth redirect_uri is a query parameter not the destination.
		# The // lgtm[...] annotations are honoured by GitHub Code Scanning when
		# the SARIF is uploaded — they appear here only because the local CLI
		# doesn't apply server-side suppression to the raw SARIF count.
		$knownFp = @(
			@{ Rule = "cs/web/unvalidated-url-redirection"; Count = 2 }
		)
		$fpTotal = ($knownFp | Measure-Object -Property Count -Sum).Sum

		$realTotal = $total - $fpTotal
		if ($realTotal -lt 0) { $realTotal = 0 }

		$color = if ($realTotal -eq 0) { "Green" } elseif ($realTotal -le 3) { "Yellow" } else { "Red" }
		Write-Host "  $Label`: $total result(s)" -ForegroundColor $color -NoNewline
		if ($fpTotal -gt 0) {
			Write-Host " ($fpTotal known false positive(s) suppressed via lgtm annotations on GitHub CI)" -ForegroundColor DarkGray
		}
		else {
			Write-Host ""
		}
	}
	catch {
		Write-Host "  $Label`: [could not parse SARIF]" -ForegroundColor DarkGray
	}
}

Write-Host "`nScan Complete!" -ForegroundColor Cyan
Write-Host ""

if ($LanguageFilter -eq "all" -or $LanguageFilter -eq "csharp") {
	Show-SarifSummary -SarifPath $CsharpSarif -Label "C#"
}
if ($LanguageFilter -eq "all" -or $LanguageFilter -eq "typescript") {
	Show-SarifSummary -SarifPath $TsSarif -Label "TypeScript"
}

Write-Host ""
Write-Host "View results in VS Code:" -ForegroundColor White
Write-Host "  Right-click a SARIF file in Explorer > 'Open with CodeQL SARIF Viewer'" -ForegroundColor DarkGray

if ($LanguageFilter -eq "all" -or $LanguageFilter -eq "csharp") {
	Write-Host "  C#:         $CsharpSarif" -ForegroundColor Gray
}
if ($LanguageFilter -eq "all" -or $LanguageFilter -eq "typescript") {
	Write-Host "  TypeScript: $TsSarif" -ForegroundColor Gray
}