# OpenWeather API Key Setup Guide

This guide explains how to configure the OpenWeather API key for the SeventySix application. The API key is **never stored in source control** for security reasons.

---

## 🔐 Security Model

-   **Local Development**: User Secrets (encrypted, stored outside the project)
-   **Docker/Production**: Environment Variables
-   **Source Control**: API key is **NOT** committed to the repository

---

## 📋 Prerequisites

1. Get your free OpenWeather API key from [https://openweathermap.org/api](https://openweathermap.org/api)
2. Ensure you have .NET 8.0 SDK installed

---

## 🛠️ Setup Instructions

### Option 1: Local Development (User Secrets) - **Recommended**

User Secrets is the safest method for local development. The API key is stored encrypted on your machine, outside the project directory.

#### Windows/PowerShell

```powershell
cd SeventySix.Server\SeventySix.Api
dotnet user-secrets set "OpenWeather:ApiKey" "YOUR_API_KEY_HERE"
```

#### Linux/macOS

```bash
cd SeventySix.Server/SeventySix.Api
dotnet user-secrets set "OpenWeather:ApiKey" "YOUR_API_KEY_HERE"
```

#### Verify Setup

```bash
dotnet user-secrets list
```

You should see:

```
OpenWeather:ApiKey = YOUR_API_KEY_HERE
```

---

### Option 2: Environment Variables (Docker/Production)

For containerized or production environments, use environment variables.

#### Docker Compose

Create a `.env` file in the `SeventySix.Server` directory:

```env
OPENWEATHER_APIKEY=YOUR_API_KEY_HERE
```

Then reference it in `docker-compose.yml`:

```yaml
environment:
    - OpenWeather__ApiKey=${OPENWEATHER_APIKEY}
```

#### Docker Run

```bash
docker run -e OpenWeather__ApiKey=YOUR_API_KEY_HERE sevenysix-api
```

#### System Environment Variable (Windows)

```powershell
$env:OpenWeather__ApiKey = "YOUR_API_KEY_HERE"
dotnet run --project SeventySix.Api
```

#### System Environment Variable (Linux/macOS)

```bash
export OpenWeather__ApiKey="YOUR_API_KEY_HERE"
dotnet run --project SeventySix.Api
```

---

### Option 3: Local Override File (Not Recommended for Production)

Create `appsettings.Development.local.json` (already in `.gitignore`):

```json
{
	"OpenWeather": {
		"ApiKey": "YOUR_API_KEY_HERE"
	}
}
```

**Note**: This file will be ignored by Git but is less secure than User Secrets.

---

## 🔍 Configuration Priority

.NET loads configuration in this order (later sources override earlier ones):

1. `appsettings.json`
2. `appsettings.{Environment}.json`
3. **User Secrets** (Development only)
4. **Environment Variables**
5. Command-line arguments

---

## ✅ Verification

Run the API and check the logs:

```bash
cd SeventySix.Server\SeventySix.Api
dotnet run
```

If configured correctly, you should see:

-   No errors about missing API key
-   Successful API calls to OpenWeather in the logs

---

## 🚨 Security Warnings

❌ **NEVER** commit your API key to source control
❌ **NEVER** hardcode the API key in `appsettings.json`
❌ **NEVER** share your API key in public channels
✅ **ALWAYS** use User Secrets for local development
✅ **ALWAYS** use Environment Variables for production

---

## 🐛 Troubleshooting

### "API key is required" Error

-   Verify User Secrets: `dotnet user-secrets list`
-   Check environment variables: `echo $env:OpenWeather__ApiKey` (Windows) or `echo $OpenWeather__ApiKey` (Linux/macOS)
-   Ensure the configuration key uses double underscores (`__`) for environment variables

### API Key Not Loading

1. Check that `UserSecretsId` is in `SeventySix.Api.csproj`
2. Restart your IDE/terminal after setting environment variables
3. Verify configuration priority order

### Docker Container Issues

-   Ensure `.env` file is in the same directory as `docker-compose.yml`
-   Check that environment variables are passed correctly: `docker exec <container> env | grep OpenWeather`

---

## 📚 Additional Resources

-   [.NET User Secrets Documentation](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets)
-   [OpenWeather API Documentation](https://openweathermap.org/api)
-   [ASP.NET Core Configuration](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/)
