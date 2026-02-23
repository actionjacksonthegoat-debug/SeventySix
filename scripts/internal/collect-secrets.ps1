#Requires -Version 7.4
# collect-secrets.ps1
# Interactive secrets collection — prompts for all required sensitive values,
# stores them in .NET user-secrets. Called by bootstrap.ps1.

[CmdletBinding()]
param(
	[switch]$NonInteractive  # For CI/testing — uses defaults
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$apiProjectPath = Join-Path $repoRoot "SeventySix.Server" "SeventySix.Api"

# Helper Functions

function Read-Prompt {
	param(
		[string]$Prompt,
		[string]$Default = "",
		[int]$MinLength = 0
	)
	# Always plain text — supports paste, shows value, works with huge keys
	do {
		$display = if ($Default) { "$Prompt [$Default]" } else { $Prompt }
		$value = Read-Host -Prompt $display
		if ([string]::IsNullOrWhiteSpace($value) -and $Default) {
			$value = $Default
		}
		if ($MinLength -gt 0 -and $value.Length -lt $MinLength) {
			Write-Host "  [ERROR] Must be at least $MinLength characters. Got: $($value.Length)" -ForegroundColor Red
		}
	} while ($MinLength -gt 0 -and $value.Length -lt $MinLength)
	return $value
}

function New-RandomString {
	param([int]$Length = 64)
	$chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	$random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
	$bytes = [byte[]]::new($Length)
	$random.GetBytes($bytes)
	return -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })
}

function New-RandomBase64 {
	param([int]$ByteCount = 64)
	$bytes = [byte[]]::new($ByteCount)
	$random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
	$random.GetBytes($bytes)
	return [Convert]::ToBase64String($bytes)
}

# Check for existing secrets

$existingSecrets = $null
$existingCount = 0
try {
	Push-Location $apiProjectPath
	$existingJson = & dotnet user-secrets list --json 2>$null
	Pop-Location
	# dotnet user-secrets list --json may exit non-zero in some environments — check content
	if ($existingJson) {
		$combined = ($existingJson | Where-Object { $_ -notmatch '^//BEGIN|^//END' }) -join "`n"
		$trimmed = $combined.Trim()
		if ($trimmed.StartsWith('{') -and $trimmed.Length -gt 2) {
			try {
				$existingSecrets = $trimmed | ConvertFrom-Json
				$existingCount = ($existingSecrets.PSObject.Properties | Measure-Object).Count
			}
			catch { $existingCount = 0 }
		}
	}
}
catch {
	try { Pop-Location } catch { }
}

if ($existingCount -gt 0) {
	Write-Host ""
	Write-Host "[INFO] Existing user secrets detected ($existingCount keys)." -ForegroundColor Yellow
	$overwrite = Read-Host "  Overwrite with new values? (y/N)"
	if ($overwrite -notmatch '^[yY]') {
		Write-Host "  Keeping existing secrets. Skipping collection."
		return
	}
}

# Collect Secrets

Write-Host ""
Write-Host "========================================"
Write-Host "  SeventySix — Secret Configuration"
Write-Host "========================================"
Write-Host ""
Write-Host "These secrets are stored locally in .NET user-secrets (never committed to git)."
Write-Host "They are used for local development Docker containers and Chrome DevTools testing."
Write-Host ""

Write-Host "--- Admin Account (Development Only) ---" -ForegroundColor Cyan
Write-Host "  The seeded admin account is used for local dev and Chrome DevTools MFA testing."
Write-Host "  Use a real email address — MFA verification codes are sent here."
Write-Host ""

$adminEmail = Read-Prompt -Prompt "  Admin User Email"
$adminPassword = Read-Prompt -Prompt "  Admin User Password (min 12 chars)" -MinLength 12

Write-Host ""
Write-Host "--- Database ---" -ForegroundColor Cyan
Write-Host "  Password for the local PostgreSQL container. Used only in dev — never reaches production."
Write-Host ""

$dbPassword = Read-Prompt -Prompt "  Database Container Password (min 8 chars)" -MinLength 8

Write-Host ""
Write-Host "--- [OPTIONAL] Email (Brevo SMTP) ---" -ForegroundColor Cyan
Write-Host "  Press Enter to skip — login will work with email + password only (no MFA email codes)."
Write-Host "  You can add these later by running: npm run secrets:set"
Write-Host "  Free tier: 300 emails/day (the app self-limits to 250/day)."
Write-Host "  Sign up: https://app.brevo.com/account/register"
Write-Host "  Find keys at: Settings > SMTP & API > SMTP Keys"
Write-Host ""

$smtpUsername = Read-Prompt -Prompt "  Brevo SMTP Username (e.g. 123abc@smtp-brevo.com)"
$smtpPassword = Read-Prompt -Prompt "  Brevo SMTP Password / API Key (the long xsmtpsib-... key)"
$fromAddress = Read-Prompt -Prompt "  Sender Email Address (the From: address for outbound mail)"

if ([string]::IsNullOrWhiteSpace($smtpUsername)) { $smtpUsername = "PLACEHOLDER_USE_USER_SECRETS" }
if ([string]::IsNullOrWhiteSpace($smtpPassword)) { $smtpPassword = "PLACEHOLDER_USE_USER_SECRETS" }
if ([string]::IsNullOrWhiteSpace($fromAddress)) { $fromAddress = "PLACEHOLDER_USE_USER_SECRETS" }

Write-Host ""
Write-Host "--- [OPTIONAL] GitHub OAuth App ---" -ForegroundColor Cyan
Write-Host "  Press Enter to skip — OAuth login button will be hidden."
Write-Host "  You can add these later by running: npm run secrets:set"
Write-Host "  Create an app at: https://github.com/settings/developers"
Write-Host "  Homepage URL:           https://localhost:4200"
Write-Host "  Authorization callback: https://localhost:7074/api/v1/auth/oauth/github/callback"
Write-Host ""

$githubClientId = Read-Prompt -Prompt "  GitHub OAuth App Client ID"
$githubClientSecret = Read-Prompt -Prompt "  GitHub OAuth App Client Secret (the ghp_... or long hex value)"

if ([string]::IsNullOrWhiteSpace($githubClientId)) { $githubClientId = "PLACEHOLDER_USE_USER_SECRETS" }
if ([string]::IsNullOrWhiteSpace($githubClientSecret)) { $githubClientSecret = "PLACEHOLDER_USE_USER_SECRETS" }

Write-Host ""
Write-Host "--- Data Protection Certificate ---" -ForegroundColor Cyan
Write-Host "  Password used to encrypt the ASP.NET Core Data Protection key ring PFX file."
Write-Host "  Pick any strong password — you will need it if you ever regenerate the certificate."
Write-Host ""

$dataProtectionPassword = Read-Prompt -Prompt "  Data Protection Certificate Password (min 8 chars)" -MinLength 8

# Auto-generated values

$jwtSecretKey = New-RandomString -Length 64
$altchaHmacKey = New-RandomBase64 -ByteCount 64

# Review & Confirm

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Review Configuration" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

$maskedAdminPw = if ($adminPassword.Length -gt 3) { "$($adminPassword.Substring(0,3))****" } else { "****" }
$maskedDbPw = if ($dbPassword.Length -gt 3) { "$($dbPassword.Substring(0,3))****" }    else { "****" }
$maskedSmtpPw = if ($smtpPassword -eq "PLACEHOLDER_USE_USER_SECRETS") { "[skipped]" }
elseif ($smtpPassword.Length -gt 6) { "$($smtpPassword.Substring(0,6))****" }
else { "****" }
$maskedOAuthSec = if ($githubClientSecret -eq "PLACEHOLDER_USE_USER_SECRETS") { "[skipped]" }
elseif ($githubClientSecret.Length -gt 6) { "$($githubClientSecret.Substring(0,6))****" }
else { "****" }
$maskedDpPw = if ($dataProtectionPassword.Length -gt 3) { "$($dataProtectionPassword.Substring(0,3))****" } else { "****" }

Write-Host "  Admin User Email:              $adminEmail"
Write-Host "  Admin User Password:           $maskedAdminPw"
Write-Host "  Database Container Password:   $maskedDbPw"
Write-Host "  Brevo SMTP Username:           $smtpUsername"
Write-Host "  Brevo SMTP Password/Key:       $maskedSmtpPw"
Write-Host "  Sender Email Address:          $fromAddress"
Write-Host "  GitHub OAuth Client ID:        $githubClientId"
Write-Host "  GitHub OAuth Client Secret:    $maskedOAuthSec"
Write-Host "  DataProtection Cert Password:  $maskedDpPw"
Write-Host "  JWT Secret Key:                [auto-generated]"
Write-Host "  Altcha HMAC Key:               [auto-generated]"
Write-Host ""
Write-Host "  Press Enter to save, or Ctrl+C to abort."
Read-Host

# Write to User Secrets

Push-Location $apiProjectPath
& dotnet user-secrets init 2>$null

$secrets = @{
	"AdminSeeder:Email"                   = $adminEmail
	"AdminSeeder:InitialPassword"         = $adminPassword
	"Database:Host"                       = "localhost"
	"Database:Port"                       = "5433"
	"Database:Name"                       = "seventysix"
	"Database:User"                       = "postgres"
	"Database:Password"                   = $dbPassword
	"Jwt:SecretKey"                       = $jwtSecretKey
	"Auth:OAuth:Providers:0:ClientId"     = $githubClientId
	"Auth:OAuth:Providers:0:ClientSecret" = $githubClientSecret
	"Email:SmtpUsername"                  = $smtpUsername
	"Email:SmtpPassword"                  = $smtpPassword
	"Email:FromAddress"                   = $fromAddress
	"Altcha:HmacKeyBase64"                = $altchaHmacKey
	"DataProtection:UseCertificate"       = "true"
	"DataProtection:CertificatePath"      = "/app/keys/dataprotection.pfx"
	"DataProtection:CertificatePassword"  = $dataProtectionPassword
	"Grafana:AdminUser"                   = "admin"
	"Grafana:AdminPassword"               = "admin"
	"PgAdmin:DefaultEmail"                = "pgadmin@example.com"
	"PgAdmin:DefaultPassword"             = "pgadmin"
}

foreach ($key in $secrets.Keys) {
	& dotnet user-secrets set $key $secrets[$key] 2>$null
}

Pop-Location

Write-Host ""
Write-Host "[SUCCESS] All secrets saved to .NET user-secrets." -ForegroundColor Green
Write-Host "[INFO] The seeded admin user (username: 'admin') will use:" -ForegroundColor Cyan
Write-Host "  Email:    $adminEmail" -ForegroundColor Cyan
Write-Host "  Password: (as entered above)" -ForegroundColor Cyan
Write-Host "[INFO] These credentials are used for Chrome DevTools testing." -ForegroundColor Cyan
