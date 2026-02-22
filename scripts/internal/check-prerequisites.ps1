#Requires -Version 7.4
# check-prerequisites.ps1
# Data-driven tool prerequisite detection and optional installation.
# Called by bootstrap.ps1 — not intended for direct use.

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Tool definition table — add new tools here, zero new code required
$tools = @(
	@{
		Name        = "PowerShell 7"
		Command     = "pwsh"
		VersionArg  = "--version"
		VersionRx   = 'PowerShell (\d+\.\d+\.\d+)'
		MinVersion  = [version]"7.4.0"
		WingetId    = "Microsoft.PowerShell"
		DownloadUrl = "https://aka.ms/install-powershell"
		Required    = $true
	},
	@{
		Name        = "Git"
		Command     = "git"
		VersionArg  = "--version"
		VersionRx   = '(\d+\.\d+\.\d+)'
		MinVersion  = [version]"2.30.0"
		WingetId    = "Git.Git"
		DownloadUrl = "https://git-scm.com/download/win"
		Required    = $true
	},
	@{
		Name        = ".NET 10 SDK"
		Command     = "dotnet"
		VersionArg  = $null           # special: uses --list-sdks
		VersionRx   = '^(10\.\d+\.\d+)'
		MinVersion  = [version]"10.0.100"
		WingetId    = "Microsoft.DotNet.SDK.10"
		DownloadUrl = "https://dotnet.microsoft.com/download/dotnet/10.0"
		Required    = $true
	},
	@{
		Name        = "Node.js 22"
		Command     = "node"
		VersionArg  = "--version"
		VersionRx   = 'v(\d+\.\d+\.\d+)'
		MinVersion  = [version]"22.0.0"
		WingetId    = "OpenJS.NodeJS.LTS"
		DownloadUrl = "https://nodejs.org/en/download/"
		Required    = $true
	},
	@{
		Name        = "Docker Desktop"
		Command     = "docker"
		VersionArg  = "--version"
		VersionRx   = '(\d+\.\d+\.\d+)'
		MinVersion  = [version]"4.0.0"
		WingetId    = "Docker.DockerDesktop"
		DownloadUrl = "https://www.docker.com/products/docker-desktop/"
		Required    = $true
	}
)

function Get-ToolVersion {
	param($tool)
	try {
		if ($null -eq $tool.VersionArg) {
			# Special case: .NET SDK list
			$output = & dotnet --list-sdks 2>$null
			$match = $output | Select-String $tool.VersionRx | Select-Object -First 1
			if ($match) {
				$rxMatch = [regex]::Match($match.ToString(), $tool.VersionRx)
				if ($rxMatch.Success) { return [version]$rxMatch.Groups[1].Value }
			}
			return $null
		}
		else {
			$output = & $tool.Command $tool.VersionArg 2>$null
			$match = [regex]::Match($output, $tool.VersionRx)
			if ($match.Success) { return [version]$match.Groups[1].Value }
			return $null
		}
	}
	catch { return $null }
}

function Install-ViaWingetOrUrl {
	param([string]$WingetId, [string]$DownloadUrl, [string]$ToolName)

	if (Get-Command winget -ErrorAction SilentlyContinue) {
		Write-Host "  Installing $ToolName via winget..."
		winget install --id $WingetId --accept-source-agreements --accept-package-agreements
		if ($LASTEXITCODE -ne 0) {
			Write-Host "  winget failed. Download manually: $DownloadUrl"
			Write-Host "  Press Enter after installing..."; Read-Host
		}
	}
	else {
		Write-Host "  winget unavailable. Download $ToolName from: $DownloadUrl"
		Write-Host "  Press Enter after installing..."; Read-Host
	}
	# Refresh PATH so newly installed tools are found in this session
	$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
	[System.Environment]::GetEnvironmentVariable("Path", "User")
}

function Assert-Tool {
	param($tool)
	$current = Get-ToolVersion $tool
	if ($null -eq $current) {
		Write-Host "[MISSING] $($tool.Name) is not installed."
		$install = Read-Host "  Install $($tool.Name)? (y/N)"
		if ($install -match '^[yY]') {
			Install-ViaWingetOrUrl -WingetId $tool.WingetId -DownloadUrl $tool.DownloadUrl -ToolName $tool.Name
		}
		elseif ($tool.Required) {
			Write-Error "$($tool.Name) is required. Install from: $($tool.DownloadUrl)"
			exit 1
		}
	}
	elseif ($current -lt $tool.MinVersion) {
		Write-Host "[OUTDATED] $($tool.Name) $current found (minimum: $($tool.MinVersion))"
		$upgrade = Read-Host "  Upgrade? (y/N)"
		if ($upgrade -match '^[yY]') {
			Install-ViaWingetOrUrl -WingetId $tool.WingetId -DownloadUrl $tool.DownloadUrl -ToolName $tool.Name
		}
		else {
			Write-Host "  Continuing with $($tool.Name) $current (may cause issues)"
		}
	}
	else {
		Write-Host "[OK] $($tool.Name) $current"
	}
}

# Run all tool checks
foreach ($tool in $tools) { Assert-Tool $tool }

# Docker daemon check — verify it's running (not just installed)
# Delegate actual Docker Desktop start to bootstrap.ps1 → start-dev.ps1 at end of run.
# Here we just verify the daemon responds; if not, inform the user.
$dockerInfo = & docker info 2>$null
if ($LASTEXITCODE -ne 0) {
	Write-Host "[INFO] Docker is installed but daemon is not running."
	Write-Host "  Docker will be started automatically when you run 'npm start'."
	Write-Host "  Or start Docker Desktop manually now, then press Enter to continue."
	Read-Host
}
