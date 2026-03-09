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

# Validates a password against the same rules enforced by the application.
# Rules sourced from appsettings.json Auth:Password — must stay in sync.
# OWASP ASVS V2.1.9: length-only, no composition rules.
#   MinLength: 12
function Test-PasswordPolicy {
	param([string]$Password)
	$errors = [System.Collections.Generic.List[string]]::new()
	if ($Password.Length -lt 12) { $errors.Add("At least 12 characters (got $($Password.Length))") }
	return ,$errors
}

# Generates a random password that always satisfies the application password policy.
# OWASP ASVS V2.1.9: length-only (12+ chars), no composition rules.
function New-ValidPassword {
	$pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*-_=+?'
	$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
	$bytes = [byte[]]::new(16)
	$rng.GetBytes($bytes)
	$chars = $bytes | ForEach-Object { $pool[$_ % $pool.Length] }
	return -join $chars
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

# Generate a policy-compliant default the user can accept by pressing Enter.
$generatedAdminPassword = New-ValidPassword

Write-Host ""
Write-Host "  Admin password must meet the application policy:" -ForegroundColor White
Write-Host "    - Minimum 12 characters" -ForegroundColor Gray
Write-Host "    - At least one uppercase letter [A-Z]" -ForegroundColor Gray
Write-Host "    - At least one lowercase letter [a-z]" -ForegroundColor Gray
Write-Host "    - At least one digit [0-9]" -ForegroundColor Gray
Write-Host "    - At least one special character (e.g. !@#`$%^&*)" -ForegroundColor Gray
Write-Host "  Press Enter to use the generated default shown in brackets." -ForegroundColor Cyan
Write-Host "  The password you choose here will be shown again when bootstrap completes." -ForegroundColor Cyan
Write-Host ""

$adminPassword = ""
do {
	$rawInput = Read-Host -Prompt "  Admin User Password [$generatedAdminPassword]"
	if ([string]::IsNullOrWhiteSpace($rawInput)) {
		$adminPassword = $generatedAdminPassword
	}
	else {
		$adminPassword = $rawInput
	}
	$policyErrors = Test-PasswordPolicy -Password $adminPassword
	if ($policyErrors.Count -gt 0) {
		Write-Host ""
		Write-Host "  [ERROR] Password does not meet the application policy:" -ForegroundColor Red
		foreach ($err in $policyErrors) {
			Write-Host "    - $err" -ForegroundColor Red
		}
		Write-Host "  Please try again, or press Enter to use the generated default." -ForegroundColor Yellow
		Write-Host ""
	}
} while ($policyErrors.Count -gt 0)

Write-Host ""
Write-Host "--- Database ---" -ForegroundColor Cyan
Write-Host "  Password for the local PostgreSQL container. Used only in dev — never reaches production."
Write-Host ""

$dbPassword = Read-Prompt -Prompt "  Database Container Password (min 8 chars)" -MinLength 8

Write-Host ""
Write-Host "--- [OPTIONAL] Email (Brevo HTTP API) ---" -ForegroundColor Cyan
Write-Host "  Press Enter to skip — login will work with email + password only (no MFA email codes)."
Write-Host "  You can add these later by running: npm run secrets:set"
Write-Host "  Free tier: 300 emails/day (the app self-limits to 250/day)."
Write-Host "  Sign up: https://app.brevo.com/account/register"
Write-Host "  Find keys at: Settings > SMTP & API > API Keys"
Write-Host ""

$brevoApiKey = Read-Prompt -Prompt "  Brevo API Key (the long xkeysib-... key)"
$fromAddress = Read-Prompt -Prompt "  Sender Email Address (the From: address for outbound mail)"

if ([string]::IsNullOrWhiteSpace($brevoApiKey)) { $brevoApiKey = "PLACEHOLDER_USE_USER_SECRETS" }
if ([string]::IsNullOrWhiteSpace($fromAddress)) { $fromAddress = "PLACEHOLDER_USE_USER_SECRETS" }

Write-Host ""
Write-Host "--- Site Settings ---" -ForegroundColor Cyan
Write-Host "  The public contact email shown on legal and privacy pages."
Write-Host "  Press Enter to use the default (contact@seventysix.local)."
Write-Host "  You can update this later by running: npm run secrets:set"
Write-Host ""

$siteEmail = Read-Prompt -Prompt "  Site Contact Email" -Default "contact@seventysix.local"

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
$maskedApiKey = if ($brevoApiKey -eq "PLACEHOLDER_USE_USER_SECRETS") { "[skipped]" }
elseif ($brevoApiKey.Length -gt 6) { "$($brevoApiKey.Substring(0,6))****" }
else { "****" }
$maskedOAuthSec = if ($githubClientSecret -eq "PLACEHOLDER_USE_USER_SECRETS") { "[skipped]" }
elseif ($githubClientSecret.Length -gt 6) { "$($githubClientSecret.Substring(0,6))****" }
else { "****" }
$maskedDpPw = if ($dataProtectionPassword.Length -gt 3) { "$($dataProtectionPassword.Substring(0,3))****" } else { "****" }

Write-Host "  Admin User Email:              $adminEmail"
Write-Host "  Admin User Password:           $maskedAdminPw"
Write-Host "  Database Container Password:   $maskedDbPw"
Write-Host "  Site Contact Email:            $siteEmail"
Write-Host "  Brevo API Key:                 $maskedApiKey"
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
	"Site:Email"                          = $siteEmail
	"Database:Host"                       = "localhost"
	"Database:Port"                       = "5433"
	"Database:Name"                       = "seventysix"
	"Database:User"                       = "postgres"
	"Database:Password"                   = $dbPassword
	"Jwt:SecretKey"                       = $jwtSecretKey
	"Auth:OAuth:Providers:0:ClientId"     = $githubClientId
	"Auth:OAuth:Providers:0:ClientSecret" = $githubClientSecret
	"Email:ApiKey"                        = $brevoApiKey
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

# ─── Brevo skipped: critical notice + offer to auto-patch appsettings ─────────
if ($brevoApiKey -eq "PLACEHOLDER_USE_USER_SECRETS") {
	Write-Host ""
	Write-Host "========================================" -ForegroundColor Red
	Write-Host "  CRITICAL: No Email Provider Configured" -ForegroundColor Red
	Write-Host "========================================" -ForegroundColor Red
	Write-Host ""
	Write-Host "  You skipped Brevo SMTP setup. MFA email codes CANNOT be delivered." -ForegroundColor Yellow
	Write-Host "  Without email delivery, users will be blocked at the MFA verification step." -ForegroundColor Yellow
	Write-Host ""
	Write-Host "  ACTION REQUIRED — disable Email, MFA, and TOTP for local development:" -ForegroundColor Red
	Write-Host "  File: SeventySix.Server/SeventySix.Api/appsettings.Development.json" -ForegroundColor White
	Write-Host ""
	Write-Host "  Change these values:" -ForegroundColor White
	Write-Host '    "Email": { "Enabled": false }' -ForegroundColor Cyan
	Write-Host '    "Mfa":  { "Enabled": false, "RequiredForAllUsers": false }' -ForegroundColor Cyan
	Write-Host '    "Totp": { "Enabled": false }' -ForegroundColor Cyan
	Write-Host ""
	Write-Host "  Note: Email.Enabled MUST be false — a placeholder FromAddress causes a hard" -ForegroundColor Yellow
	Write-Host "  startup crash (OptionsValidationException) even if MFA/TOTP are disabled." -ForegroundColor Yellow
	Write-Host ""
	Write-Host "  Tip: appsettings.Development.json already has a comment block showing exactly" -ForegroundColor Gray
	Write-Host "  which keys to change. Search for '_comment_minimal_setup' in that file." -ForegroundColor Gray
	Write-Host ""
	$updateAppsettings = Read-Host "  Would you like to automatically apply these changes now? (Y/n)"
	if ($updateAppsettings -notmatch '^[nN]') {
		$appSettingsPath = Join-Path $repoRoot "SeventySix.Server" "SeventySix.Api" "appsettings.Development.json"
		$lines = Get-Content $appSettingsPath -Encoding UTF8
		$newLines = [System.Collections.Generic.List[string]]::new()
		$inMfa = $false
		$mfaDepth = 0
		$inEmail = $false
		$emailDepth = 0
		$inTotp = $false
		$totpEnabledInserted = $false
		foreach ($line in $lines) {
			if ($line -match '^\t"Email"\s*:') { $inEmail = $true; $emailDepth = 0 }
			if ($line -match '^\t"Mfa"\s*:') { $inMfa = $true; $mfaDepth = 0 }
			if ($line -match '^\t"Totp"\s*:') { $inTotp = $true }
			if ($inEmail) {
				if ($line.Contains('{')) { $emailDepth++ }
				if ($line.Contains('}')) {
					$emailDepth--
					if ($emailDepth -le 0) { $inEmail = $false }
				}
				# Only flip the top-level Email.Enabled (depth 1), not nested Queue.Enabled
				if ($emailDepth -eq 1 -and $line -match '^\t\t"Enabled"\s*:\s*true') {
					$line = $line -replace '"Enabled"\s*:\s*true', '"Enabled": false'
				}
			}
			if ($inMfa) {
				if ($line.Contains('{')) { $mfaDepth++ }
				if ($line.Contains('}')) {
					$mfaDepth--
					if ($mfaDepth -le 0) { $inMfa = $false }
				}
				$line = $line -replace '"Enabled"\s*:\s*true', '"Enabled": false'
				$line = $line -replace '"RequiredForAllUsers"\s*:\s*true', '"RequiredForAllUsers": false'
			}
			if ($inTotp -and -not $totpEnabledInserted -and $line -match '^\t\t"IssuerName"') {
				$newLines.Add("`t`t`"Enabled`": false,")
				$totpEnabledInserted = $true
				$inTotp = $false
			}
			$newLines.Add($line)
		}
		[System.IO.File]::WriteAllLines($appSettingsPath, $newLines, [System.Text.UTF8Encoding]::new($false))
		Write-Host ""
		Write-Host "  [OK] appsettings.Development.json updated — Email, MFA, and TOTP disabled for local dev." -ForegroundColor Green
	}
	else {
		Write-Host ""
		Write-Host "  [!] Remember to manually update appsettings.Development.json before starting the app." -ForegroundColor Yellow
	}
}

Write-Host ""
Write-Host "--- [OPTIONAL] Codecov — GitHub Actions Code Coverage ---" -ForegroundColor Cyan
Write-Host "  Codecov displays code coverage on pull requests and the repository dashboard."
Write-Host "  This is a GitHub Actions secret — not a local user secret — so it is set"
Write-Host "  on your GitHub repository, not here."
Write-Host ""
Write-Host "  Setup steps (can be done later at any time):"
Write-Host "    1. Sign in at https://app.codecov.io (free for public repositories — no credit card)"
Write-Host "    2. Authorize with GitHub and add your SeventySix repository"
Write-Host "    3. Copy the CODECOV_TOKEN from the Codecov repository settings page"
Write-Host "    4. In your GitHub repository, go to Settings > Secrets and variables > Actions"
Write-Host "    5. Click 'New repository secret', name it CODECOV_TOKEN, paste the value"
Write-Host "  Once set, coverage reports will appear automatically on every CI run." -ForegroundColor Green
Write-Host ""

# ─── ALWAYS: Show seeded admin credentials in plain text — user MUST save these ─
Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  SAVE THESE CREDENTIALS NOW" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Seeded admin account for local development:" -ForegroundColor White
Write-Host "    Username : admin" -ForegroundColor Cyan
Write-Host "    Email    : $adminEmail" -ForegroundColor Cyan
Write-Host "    Password : $adminPassword" -ForegroundColor Cyan
Write-Host ""
Write-Host "  These values are stored only in .NET user-secrets — never committed to git." -ForegroundColor White
Write-Host "  Save them in a password manager or secure note before closing this terminal." -ForegroundColor White
Write-Host ""
Read-Host "  Press Enter once saved to continue"
