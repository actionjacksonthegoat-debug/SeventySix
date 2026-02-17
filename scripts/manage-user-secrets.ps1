# Manages user secrets for SeventySix development.
# This will run 'dotnet user-secrets' commands for developer instances only.
# Production will use environment variables which will work as user secrets in production containers,
# and local development will load secrets into environment variables for Docker Compose.
#
# Usage:
#   .\scripts\manage-user-secrets.ps1 -Action init     # Set all secrets with defaults
#   .\scripts\manage-user-secrets.ps1 -Action list     # List all current secrets
#   .\scripts\manage-user-secrets.ps1 -Action set -Key "Jwt:SecretKey" -Value "my-value"
#   .\scripts\manage-user-secrets.ps1 -Action delete -Key "Jwt:SecretKey"
#
# Managed secrets:
#   Database:Host/Port/Name/User/Password        → PostgreSQL connection
#   Jwt:SecretKey                                 → JWT signing key (auto-generated)
#   Auth:OAuth:Providers:0:ClientId/ClientSecret  → GitHub OAuth
#   Email:SmtpUsername/SmtpPassword/FromAddress    → Brevo SMTP
#   AdminSeeder:Email/InitialPassword             → Admin account seeding
#   Altcha:HmacKeyBase64                          → ALTCHA HMAC key (auto-generated)
#   DataProtection:*                              → Key protection settings + certificate
#   Grafana:AdminUser/AdminPassword               → Grafana dashboard credentials
#   PgAdmin:DefaultEmail/DefaultPassword          → pgAdmin web UI credentials

param(
	[Parameter(Mandatory = $true)]
	[ValidateSet("init", "list", "set", "delete")]
	[string]$Action,

	[string]$Key,
	[string]$Value
)

$ErrorActionPreference = "Stop"
$projectPath =
[System.IO.Path]::Combine($PSScriptRoot, "..", "SeventySix.Server", "SeventySix.Api", "SeventySix.Api.csproj")

if (-not (Test-Path $projectPath)) {
	Write-Host "Project file not found at: $projectPath" -ForegroundColor Red
	exit 1
}

switch ($Action) {
	"init" {
		Write-Host ""
		Write-Host "========================================" -ForegroundColor Cyan
		Write-Host "  Initializing User Secrets" -ForegroundColor Cyan
		Write-Host "========================================" -ForegroundColor Cyan
		Write-Host ""

		# Database
		dotnet user-secrets set "Database:Host" "localhost" --project $projectPath
		dotnet user-secrets set "Database:Port" "5433" --project $projectPath
		dotnet user-secrets set "Database:Name" "seventysix" --project $projectPath
		dotnet user-secrets set "Database:User" "postgres" --project $projectPath
		dotnet user-secrets set "Database:Password" "TestPassword" --project $projectPath

		# JWT — Generate a cryptographically random 64-character key
		$jwtSecretKey =
		-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
		dotnet user-secrets set "Jwt:SecretKey" $jwtSecretKey --project $projectPath

		# GitHub OAuth — Register at https://github.com/settings/developers
		# 1. Create a new OAuth App
		# 2. Homepage URL: https://localhost:4200
		# 3. Authorization callback URL: https://localhost:7074/api/v1/auth/oauth/github/callback
		# 4. Copy Client ID and Client Secret below
		dotnet user-secrets set "Auth:OAuth:Providers:0:ClientId" "your-github-client-id" --project $projectPath
		dotnet user-secrets set "Auth:OAuth:Providers:0:ClientSecret" "your-github-client-secret" --project $projectPath

		# Email (Brevo SMTP — replace with real credentials from https://app.brevo.com/settings/keys/smtp)
		dotnet user-secrets set "Email:SmtpUsername" "your-smtp-username" --project $projectPath
		dotnet user-secrets set "Email:SmtpPassword" "your-smtp-password" --project $projectPath
		dotnet user-secrets set "Email:FromAddress" "your-email@example.com" --project $projectPath

		# Admin Seeder
		dotnet user-secrets set "AdminSeeder:Email" "admin@seventysix.local" --project $projectPath
		dotnet user-secrets set "AdminSeeder:InitialPassword" "SeventySixAdmin76!" --project $projectPath

		# Altcha — Generate a base64-encoded 64-byte HMAC key (required by Ixnas.AltchaNet SHA-256)
		$altchaBytes = New-Object byte[] 64
		$cryptoProvider = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
		$cryptoProvider.GetBytes($altchaBytes)
		$cryptoProvider.Dispose()
		$altchaHmacKey =
		[Convert]::ToBase64String($altchaBytes)
		dotnet user-secrets set "Altcha:HmacKeyBase64" $altchaHmacKey --project $projectPath

		# Data Protection
		dotnet user-secrets set "DataProtection:UseCertificate" "true" --project $projectPath
		dotnet user-secrets set "DataProtection:AllowUnprotectedKeysInDevelopment" "false" --project $projectPath
		dotnet user-secrets set "DataProtection:CertificatePath" "/app/keys/dataprotection.pfx" --project $projectPath
		dotnet user-secrets set "DataProtection:CertificatePassword" "SeventySixAdminDataProtection76!" --project $projectPath

		# Grafana (Observability Dashboard)
		dotnet user-secrets set "Grafana:AdminUser" "admin" --project $projectPath
		dotnet user-secrets set "Grafana:AdminPassword" "admin" --project $projectPath

		# pgAdmin (PostgreSQL Web UI)
		dotnet user-secrets set "PgAdmin:DefaultEmail" "pgadmin@example.com" --project $projectPath
		dotnet user-secrets set "PgAdmin:DefaultPassword" "pgadmin" --project $projectPath

		Write-Host ""
		Write-Host "User secrets initialized." -ForegroundColor Green
		Write-Host "JWT SecretKey and Altcha HmacKey were auto-generated." -ForegroundColor Yellow
		Write-Host "Update GitHub OAuth, Email, Grafana, pgAdmin, and DataProtection values with your real credentials." -ForegroundColor Yellow
		Write-Host ""
		Write-Host "Run 'npm run secrets:list' to view current secrets." -ForegroundColor Cyan
	}
	"list" {
		Write-Host ""
		Write-Host "Current User Secrets:" -ForegroundColor Cyan
		Write-Host "========================================" -ForegroundColor Cyan
		dotnet user-secrets list --project $projectPath
		Write-Host ""
	}
	"set" {
		if (-not $Key -or -not $Value) {
			Write-Host "Both -Key and -Value are required for 'set' action." -ForegroundColor Red
			Write-Host 'Usage: .\scripts\manage-user-secrets.ps1 -Action set -Key "Jwt:SecretKey" -Value "new-value"' -ForegroundColor Yellow
			exit 1
		}
		dotnet user-secrets set $Key $Value --project $projectPath
		Write-Host "Set '$Key' successfully." -ForegroundColor Green
	}
	"delete" {
		if (-not $Key) {
			Write-Host "-Key is required for 'delete' action." -ForegroundColor Red
			Write-Host 'Usage: .\scripts\manage-user-secrets.ps1 -Action delete -Key "Jwt:SecretKey"' -ForegroundColor Yellow
			exit 1
		}
		dotnet user-secrets remove $Key --project $projectPath
		Write-Host "Removed '$Key' successfully." -ForegroundColor Green
	}
}
