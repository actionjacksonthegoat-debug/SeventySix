<#
.SYNOPSIS
    Runs server-side code coverage and generates a merged HTML + text report.
.DESCRIPTION
    1. Runs dotnet test with XPlat Code Coverage via coverlet.runsettings
    2. Merges all cobertura XML files with reportgenerator
    3. Outputs a text summary and exits non-zero if coverage is below 80%
.PARAMETER Threshold
    Minimum line coverage percentage (default 80).
#>
param(
	[int]$Threshold = 80
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Push-Location "$PSScriptRoot\..\SeventySix.Server"

try {
	# Step 1: Clean previous coverage results to avoid stale data
	Write-Host "Cleaning previous coverage results..." -ForegroundColor Cyan
	if (Test-Path ./TestResults/coverage) {
		Remove-Item -Recurse -Force ./TestResults/coverage
	}

	# Step 2: Run tests with coverage collection
	Write-Host "Running dotnet test with coverage collection..." -ForegroundColor Cyan
	dotnet test `
		--settings coverlet.runsettings `
		--collect:"XPlat Code Coverage" `
		--results-directory ./TestResults/coverage
	if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

	# Step 3: Merge reports with reportgenerator
	Write-Host "Merging coverage reports..." -ForegroundColor Cyan
	dotnet tool run reportgenerator `
		-reports:"TestResults/coverage/**/coverage.cobertura.xml" `
		-targetdir:"TestResults/coverage/report" `
		-reporttypes:"Html;TextSummary" `
		-assemblyfilters:"-SeventySix.TestUtilities;-SeventySix.*.Tests;-SeventySix.Tests;-SeventySix.Analyzers;-SeventySix.Analyzers.CodeFixes;-SeventySix.ArchitectureTests"

	# Step 3: Print summary
	$summaryPath = "TestResults/coverage/report/Summary.txt"
	if (Test-Path $summaryPath) {
		Get-Content $summaryPath
	}

	# Step 4: Check threshold (grep for line coverage in summary)
	$summary = Get-Content $summaryPath -Raw
	if ($summary -match 'Line coverage:\s+([\d.]+)%') {
		$coverage = [double]$Matches[1]
		Write-Host "Combined line coverage: $coverage%" -ForegroundColor $(if ($coverage -ge $Threshold) { 'Green' } else { 'Red' })
		if ($coverage -lt $Threshold) {
			Write-Error "Coverage $coverage% is below the required $Threshold% threshold."
			exit 1
		}
	}
	else {
		Write-Warning "Could not parse coverage from summary file."
	}
}
finally {
	Pop-Location
}
