# User Secrets Setup Guide

This guide explains how to configure sensitive settings for the SeventySix application using .NET User Secrets. User Secrets are **never stored in source control** for security reasons.

---

## 🔐 Security Model

-   **Local Development**: User Secrets (encrypted, stored outside the project)
-   **Docker/Production**: Environment Variables
-   **Source Control**: Sensitive values are **NOT** committed to the repository

---

## 📋 What You Need to Configure

The following sensitive settings should be stored in User Secrets for local development:

1. **OpenWeather API Key** - Your API key from OpenWeather
2. **Database Password** - PostgreSQL database password
3. **Database Name** - PostgreSQL database name (optional, defaults to `seventysix`)
4. **Default Coordinates** - Default latitude/longitude for weather queries

---

## 🛠️ Quick Setup (All Settings)

### Windows/PowerShell

```powershell
cd SeventySix.Server\SeventySix.Api

# OpenWeather API Key
dotnet user-secrets set "OpenWeather:ApiKey" "YOUR_OPENWEATHER_API_KEY_HERE"

# Database Configuration
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=seventysix_dev;Username=postgres;Password=TestPassword;Pooling=true;Minimum Pool Size=1;Maximum Pool Size=20;Include Error Detail=true"

# Default Weather Coordinates (New York City example)
dotnet user-secrets set "OpenWeather:DefaultLatitude" "40.7128"
dotnet user-secrets set "OpenWeather:DefaultLongitude" "-74.0060"
```

### Linux/macOS

```bash
cd SeventySix.Server/SeventySix.Api

# OpenWeather API Key
dotnet user-secrets set "OpenWeather:ApiKey" "YOUR_OPENWEATHER_API_KEY_HERE"

# Database Configuration
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=seventysix_dev;Username=postgres;Password=TestPassword;Pooling=true;Minimum Pool Size=1;Maximum Pool Size=20;Include Error Detail=true"

# Default Weather Coordinates (New York City example)
dotnet user-secrets set "OpenWeather:DefaultLatitude" "40.7128"
dotnet user-secrets set "OpenWeather:DefaultLongitude" "-74.0060"
```

---

## 📝 Detailed Configuration

### 1. OpenWeather API Key

Get your free API key from [https://openweathermap.org/api](https://openweathermap.org/api)

```powershell
dotnet user-secrets set "OpenWeather:ApiKey" "your_actual_api_key_here"
```

### 2. Database Connection String

Configure your local PostgreSQL connection:

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=seventysix_dev;Username=postgres;Password=YOUR_PASSWORD_HERE;Pooling=true;Minimum Pool Size=1;Maximum Pool Size=20;Include Error Detail=true"
```

**Common database names:**

-   Development: `seventysix_dev`
-   Testing: `seventysix_test`
-   Production: `seventysix`

### 3. Default Coordinates

Set default latitude and longitude for weather queries:

```powershell
# New York City
dotnet user-secrets set "OpenWeather:DefaultLatitude" "40.7128"
dotnet user-secrets set "OpenWeather:DefaultLongitude" "-74.0060"

# Los Angeles
dotnet user-secrets set "OpenWeather:DefaultLatitude" "34.0522"
dotnet user-secrets set "OpenWeather:DefaultLongitude" "-118.2437"

# London
dotnet user-secrets set "OpenWeather:DefaultLatitude" "51.5074"
dotnet user-secrets set "OpenWeather:DefaultLongitude" "-0.1278"
```

---

## ✅ Verify Configuration

List all configured User Secrets:

```powershell
cd SeventySix.Server\SeventySix.Api
dotnet user-secrets list
```

Expected output:

```
OpenWeather:ApiKey = abc123xyz...
ConnectionStrings:DefaultConnection = Host=localhost;Port=5432;Database=seventysix_dev;Username=postgres;Password=TestPassword...
OpenWeather:DefaultLatitude = 40.7128
OpenWeather:DefaultLongitude = -74.0060
```

---

## 🐳 Docker/Production Configuration

For Docker and production environments, use environment variables instead of User Secrets.

### Docker Compose (.env file)

Create a `.env` file in the `SeventySix.Server` directory:

```env
# Database Configuration
DB_PASSWORD=YOUR_PRODUCTION_PASSWORD
DB_NAME=seventysix
DB_HOST=database

# OpenWeather API
OPENWEATHER_APIKEY=YOUR_OPENWEATHER_API_KEY

# Default Coordinates
DEFAULT_LATITUDE=40.7128
DEFAULT_LONGITUDE=-74.0060
```

### docker-compose.production.yml

```yaml
services:
    api:
        environment:
            - ConnectionStrings__DefaultConnection=Host=${DB_HOST};Port=5432;Database=${DB_NAME};Username=postgres;Password=${DB_PASSWORD};Pooling=true;Minimum Pool Size=5;Maximum Pool Size=100
            - OpenWeather__ApiKey=${OPENWEATHER_APIKEY}
            - OpenWeather__DefaultLatitude=${DEFAULT_LATITUDE}
            - OpenWeather__DefaultLongitude=${DEFAULT_LONGITUDE}
```

---

## 🔍 Configuration Priority

.NET loads configuration in this order (later sources override earlier ones):

1. `appsettings.json` (base configuration)
2. `appsettings.{Environment}.json` (environment-specific)
3. **User Secrets** (Development only)
4. **Environment Variables** (Docker/Production)
5. Command-line arguments

---

## 🧪 Integration Tests Configuration

Integration tests use a separate test database configuration. You have two options:

### Option 1: User Secrets for Tests (Recommended)

```powershell
cd SeventySix.Server\SeventySix.Api.Tests
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=seventysix_test;Username=postgres;Password=TestPassword"
```

### Option 2: Hardcoded Test Configuration

Tests use localhost PostgreSQL by default. Update `PostgreSqlTestBase.cs` if needed:

```csharp
private const string LOCALCONNECTIONSTRING =
    "Host=localhost;Port=5432;Database=seventysix_test;Username=postgres;Password=TestPassword";
```

---

## 🔒 Security Best Practices

### ✅ DO:

-   Use User Secrets for local development
-   Use Environment Variables for Docker/Production
-   Store production secrets in Azure Key Vault, AWS Secrets Manager, or similar
-   Use different passwords for development and production
-   Rotate API keys and passwords regularly
-   Keep `.env` files in `.gitignore`

### ❌ DON'T:

-   Commit User Secrets to source control (they're stored outside the project)
-   Hardcode passwords in `appsettings.json` or code
-   Share your API keys or passwords publicly
-   Use production credentials in development
-   Commit `.env` files with real credentials

---

## 🐛 Troubleshooting

### User Secrets Not Loading

```powershell
# Ensure User Secrets are initialized
cd SeventySix.Server\SeventySix.Api
dotnet user-secrets init

# Check if UserSecretsId exists in .csproj
# Should see: <UserSecretsId>guid-here</UserSecretsId>
```

### Configuration Not Found

```powershell
# Verify User Secrets location
# Windows: %APPDATA%\Microsoft\UserSecrets\<user_secrets_id>\secrets.json
# Linux/macOS: ~/.microsoft/usersecrets/<user_secrets_id>/secrets.json

# List all secrets to verify
dotnet user-secrets list
```

### Database Connection Fails

```powershell
# Test PostgreSQL connection
psql -h localhost -U postgres -d seventysix_dev

# Verify connection string format
# Correct: "Host=localhost;Port=5432;Database=seventysix_dev;Username=postgres;Password=TestPassword"
# Note: Use semicolons (;) not commas
```

### Docker Environment Variables Not Working

```powershell
# Check if .env file is being loaded
docker-compose config

# Verify environment variables in container
docker exec <container-name> env | grep -i openweather
docker exec <container-name> env | grep -i db_
```

---

## 🚀 First-Time Setup Checklist

-   [ ] Get OpenWeather API key from [openweathermap.org](https://openweathermap.org/api)
-   [ ] Install PostgreSQL locally (username: `postgres`, password: `TestPassword`)
-   [ ] Create database: `CREATE DATABASE seventysix_dev;`
-   [ ] Navigate to `SeventySix.Server\SeventySix.Api`
-   [ ] Set OpenWeather API Key: `dotnet user-secrets set "OpenWeather:ApiKey" "YOUR_KEY"`
-   [ ] Set Database Connection: `dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=seventysix_dev;Username=postgres;Password=TestPassword;Pooling=true;Minimum Pool Size=1;Maximum Pool Size=20;Include Error Detail=true"`
-   [ ] Set Default Coordinates: `dotnet user-secrets set "OpenWeather:DefaultLatitude" "40.7128"` and `dotnet user-secrets set "OpenWeather:DefaultLongitude" "-74.0060"`
-   [ ] Verify: `dotnet user-secrets list`
-   [ ] Apply migrations: `dotnet ef database update`
-   [ ] Run application: `dotnet run`
-   [ ] Test API: `http://localhost:5085/scalar/v1`

---

## 📚 Additional Resources

-   [.NET User Secrets Documentation](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets)
-   [OpenWeather API Documentation](https://openweathermap.org/api)
-   [ASP.NET Core Configuration](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/)
-   [PostgreSQL Connection Strings](https://www.connectionstrings.com/npgsql/)

---

**Your secrets are now secure! 🔒**
