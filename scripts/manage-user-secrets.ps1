# ┌─────────────────────────────────────────────────────────────────────────┐
# │ LOCAL DEVELOPMENT ONLY — passwords below are NOT used in production.  │
# │ Production credentials are injected via CI/CD environment variables.  │
# └─────────────────────────────────────────────────────────────────────────┘
#
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
#   Email:ApiKey/FromAddress                     → Brevo HTTP API
#   Site:Email                                    → Public contact email for legal pages
#   AdminSeeder:Email/InitialPassword             → Admin account seeding
#   Altcha:HmacKeyBase64                          → ALTCHA HMAC key (auto-generated)
#   DataProtection:*                              → Key protection settings + certificate
#   Grafana:AdminUser/AdminPassword               → Grafana dashboard credentials
#   PgAdmin:DefaultEmail/DefaultPassword          → pgAdmin web UI credentials
#
#   Commerce:Sveltekit:*                          → SvelteKit ECommerce sandbox secrets
#   Commerce:Tanstack:*                           → TanStack ECommerce sandbox secrets
#     DatabaseUrl / PostgresPassword / MockServices / BaseUrl / StripeSecretKey /
#     StripeWebhookSecret / PrintfulApiKey / PrintfulWebhookSecret / BrevoApiKey /
#     SeventySixApiUrl / OtelEndpoint / PublicOtelEndpoint / PublicGa4MeasurementId /
#     PublicGoogleSiteVerification / PublicBingSiteVerification

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

		# Email (Brevo HTTP API — get API key from https://app.brevo.com/settings/keys/api)
		dotnet user-secrets set "Email:ApiKey" "your-brevo-api-key" --project $projectPath
		dotnet user-secrets set "Email:FromAddress" "your-email@example.com" --project $projectPath

		# Site — public contact email for legal/privacy pages
		dotnet user-secrets set "Site:Email" "support@seventysixsandbox.com" --project $projectPath

		# Admin Seeder
		dotnet user-secrets set "AdminSeeder:Email" "admin@seventysix.local" --project $projectPath
		dotnet user-secrets set "AdminSeeder:InitialPassword" "SeventySixAdmin76!" --project $projectPath

		# Altcha — Generate a base64-encoded 64-byte HMAC key (required by Ixnas.AltchaNet SHA-256)
		$altchaBytes = [byte[]]::new(64)
		[System.Security.Cryptography.RandomNumberGenerator]::Fill($altchaBytes)
		$altchaHmacKey =
		[Convert]::ToBase64String($altchaBytes)
		dotnet user-secrets set "Altcha:HmacKeyBase64" $altchaHmacKey --project $projectPath

		# Data Protection
		dotnet user-secrets set "DataProtection:UseCertificate" "true" --project $projectPath
		dotnet user-secrets set "DataProtection:CertificatePath" "/app/keys/dataprotection.pfx" --project $projectPath
		dotnet user-secrets set "DataProtection:CertificatePassword" "SeventySixAdminDataProtection76!" --project $projectPath

		# Grafana (Observability Dashboard)
		dotnet user-secrets set "Grafana:AdminUser" "admin" --project $projectPath
		dotnet user-secrets set "Grafana:AdminPassword" "admin" --project $projectPath

		# pgAdmin (PostgreSQL Web UI)
		dotnet user-secrets set "PgAdmin:DefaultEmail" "pgadmin@example.com" --project $projectPath
		dotnet user-secrets set "PgAdmin:DefaultPassword" "pgadmin" --project $projectPath

		# Commerce — SvelteKit ECommerce Sandbox
		# DB credentials match docker-compose.dev.yml in seventysixcommerce-sveltekit
		dotnet user-secrets set "Commerce:Sveltekit:DatabaseUrl" "postgresql://ssxc_dev:dev_password_only@localhost:5439/seventysixcommerce_sveltekit_dev" --project $projectPath
		dotnet user-secrets set "Commerce:Sveltekit:PostgresPassword" "dev_password_only" --project $projectPath
		dotnet user-secrets set "Commerce:Sveltekit:MockServices" "true" --project $projectPath
		dotnet user-secrets set "Commerce:Sveltekit:BaseUrl" "https://localhost:3001" --project $projectPath
		dotnet user-secrets set "Commerce:Sveltekit:StripeSecretKey" "" --project $projectPath
		dotnet user-secrets set "Commerce:Sveltekit:StripeWebhookSecret" "" --project $projectPath
		dotnet user-secrets set "Commerce:Sveltekit:PrintfulApiKey" "" --project $projectPath
		dotnet user-secrets set "Commerce:Sveltekit:PrintfulWebhookSecret" "" --project $projectPath
		dotnet user-secrets set "Commerce:Sveltekit:BrevoApiKey" "" --project $projectPath
		dotnet user-secrets set "Commerce:Sveltekit:SeventySixApiUrl" "" --project $projectPath
		dotnet user-secrets set "Commerce:Sveltekit:OtelEndpoint" "" --project $projectPath
		dotnet user-secrets set "Commerce:Sveltekit:PublicOtelEndpoint" "" --project $projectPath
		dotnet user-secrets set "Commerce:Sveltekit:PublicGa4MeasurementId" "" --project $projectPath
		dotnet user-secrets set "Commerce:Sveltekit:PublicGoogleSiteVerification" "" --project $projectPath
		dotnet user-secrets set "Commerce:Sveltekit:PublicBingSiteVerification" "" --project $projectPath

		# Commerce — TanStack ECommerce Sandbox
		# DB credentials match docker-compose.dev.yml in seventysixcommerce-tanstack
		dotnet user-secrets set "Commerce:Tanstack:DatabaseUrl" "postgresql://seventysixcommerce:seventysixcommerce_dev@localhost:5438/seventysixcommerce" --project $projectPath
		dotnet user-secrets set "Commerce:Tanstack:PostgresPassword" "seventysixcommerce_dev" --project $projectPath
		dotnet user-secrets set "Commerce:Tanstack:MockServices" "true" --project $projectPath
		dotnet user-secrets set "Commerce:Tanstack:BaseUrl" "https://localhost:3002" --project $projectPath
		dotnet user-secrets set "Commerce:Tanstack:StripeSecretKey" "" --project $projectPath
		dotnet user-secrets set "Commerce:Tanstack:StripeWebhookSecret" "" --project $projectPath
		dotnet user-secrets set "Commerce:Tanstack:PrintfulApiKey" "" --project $projectPath
		dotnet user-secrets set "Commerce:Tanstack:PrintfulWebhookSecret" "" --project $projectPath
		dotnet user-secrets set "Commerce:Tanstack:BrevoApiKey" "" --project $projectPath
		dotnet user-secrets set "Commerce:Tanstack:SeventySixApiUrl" "" --project $projectPath
		dotnet user-secrets set "Commerce:Tanstack:OtelEndpoint" "" --project $projectPath
		dotnet user-secrets set "Commerce:Tanstack:PublicOtelEndpoint" "" --project $projectPath
		dotnet user-secrets set "Commerce:Tanstack:PublicGa4MeasurementId" "" --project $projectPath
		dotnet user-secrets set "Commerce:Tanstack:PublicGoogleSiteVerification" "" --project $projectPath
		dotnet user-secrets set "Commerce:Tanstack:PublicBingSiteVerification" "" --project $projectPath

		Write-Host ""
		Write-Host "User secrets initialized." -ForegroundColor Green
		Write-Host "JWT SecretKey and Altcha HmacKey were auto-generated." -ForegroundColor Yellow
		Write-Host "Update GitHub OAuth, Email, Grafana, pgAdmin, and DataProtection values with your real credentials." -ForegroundColor Yellow
		Write-Host "Commerce sandbox secrets set with development defaults (MOCK_SERVICES=true)." -ForegroundColor Yellow
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
