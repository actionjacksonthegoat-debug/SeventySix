# Startup Instructions

A step-by-step guide for setting up SeventySix from scratch — including account creation, tool installation, VS Code configuration, and first launch. No prior development experience is assumed.

> **Fastest path**: Run the one-command bootstrap instead of following these manual steps:
>
> **Windows** (cmd.exe — no PowerShell or Node required): `scripts\bootstrap.cmd`
> **Linux / macOS** (bash — no PowerShell or Node required): `./scripts/bootstrap.sh`
>
> Both scripts install PowerShell 7 **and Node.js** automatically if they are not present, then run the full setup.
> `scripts\bootstrap.cmd` is the true entry point on Windows — run it directly from cmd.exe before anything else.
> Once bootstrap completes, use `npm run bootstrap` for subsequent runs (Node.js will then be on your PATH).
> Continue reading only if you prefer manual setup.

---

## Table of Contents

- [1. Create Required Accounts](#1-create-required-accounts)
- [2. Install Required Software](#2-install-required-software)
- [3. Configure VS Code](#3-configure-vs-code)
- [4. Clone the Repository](#4-clone-the-repository)
- [5. Install Project Dependencies](#5-install-project-dependencies)
- [6. Configure Secrets](#6-configure-secrets)
- [7. Set Up Optional Services](#7-set-up-optional-services)
- [8. Generate Certificates](#8-generate-certificates)
- [9. Start the Application](#9-start-the-application)
- [10. Verify Everything Works](#10-verify-everything-works)
- [11. Configure MCP Servers (Optional)](#11-configure-mcp-servers-optional)
- [Troubleshooting](#troubleshooting)

---

## 1. Create Required Accounts

You need a few free accounts before starting. None require a credit card.

### GitHub (Required)

GitHub hosts the repository and provides OAuth login for the application.

1. Go to [github.com/signup](https://github.com/signup)
2. Enter your email address and follow the prompts to create a username and password
3. Verify your email address when GitHub sends a confirmation
4. Choose the **Free** plan (all features needed for SeventySix are included)

### Brevo (Optional — for email delivery)

Brevo provides the SMTP service for transactional emails (registration verification, password reset, MFA codes). The application works without it, but emails will fail to send. Important: Please look for any other options at startup, this appealed as a reasonable amount of free support before I would want to consider going paid and their track record is clean as of this documentation date. Third Party API tracking can be set to lock down at monthly or daily locks, when those locks are up it will retry in the email queue service.

> **Skipping email entirely**: To run without any email requirement at all, set `"Mfa": { "Enabled": false }` in `appsettings.Development.json`. This disables the MFA email code step so login works with only email + password. See [Optional Feature Flags](#optional-feature-flags) for the full list.

1. Go to [app.brevo.com/account/register](https://app.brevo.com/account/register)
2. Create a free account (300 emails/day included — no credit card required)
3. After login, go to **Settings** → **SMTP & API** → [SMTP Keys](https://app.brevo.com/settings/keys/smtp)
4. Note your **SMTP Username** (looks like an email) and generate an **SMTP Key** (this is your password)
5. Keep these values — you will enter them during the secrets configuration step

### MaxMind GeoIP (Optional — for geo-blocking)

MaxMind provides the GeoIP database for Fail2Ban country-level IP blocking. The application runs without it, but the `geoipupdate` Docker service will show errors.

1. Go to [maxmind.com/en/geolite2/signup](https://www.maxmind.com/en/geolite2/signup)
2. Create a free GeoLite2 account
3. After login, go to **My Account** → **Manage License Keys** → **Generate New License Key**
4. Note your **Account ID** and **License Key**

---

## 2. Install Required Software

Install these tools in order. All are free.

### Git

Git is the version control system used to download and manage the code.

- **Windows**: Download from [git-scm.com/download/win](https://git-scm.com/download/win) and run the installer. Use all default options.
- **macOS**: Open Terminal and run `xcode-select --install`
- **Verify**: Open a new terminal and run:

  ```bash
  git --version
  ```

### .NET 10 SDK

The server is built with .NET 10.

1. Go to [dotnet.microsoft.com/download/dotnet/10.0](https://dotnet.microsoft.com/en-us/download/dotnet/10.0)
2. Download the **SDK** installer for your operating system (not the Runtime — you need the full SDK)
3. Run the installer
4. Verify:

   ```bash
   dotnet --version
   # Should show 10.0.100 or higher
   ```

### Node.js 22+

The client application and build tools require Node.js.

1. Go to [nodejs.org](https://nodejs.org/)
2. Download the **LTS** version (22.x or higher)
3. Run the installer. On Windows, check the box to **automatically install necessary tools** if prompted
4. Verify:

   ```bash
   node --version
   # Should show v22.x.x or higher

   npm --version
   # Should show 10.x or higher
   ```

### Docker Desktop

Docker runs the database, cache, and observability services.

1. Go to [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
2. Download and install for your operating system
3. Launch Docker Desktop and let it finish starting (the whale icon in the system tray should stop animating)
4. Verify:

   ```bash
   docker --version
   # Should show Docker version 27.x or higher
   ```

### VS Code

The recommended editor with built-in Copilot integration.

1. Go to [code.visualstudio.com](https://code.visualstudio.com/)
2. Download and install for your operating system
3. Launch VS Code

---

## 3. Configure VS Code

### Install Required Extensions

Open VS Code, press `Ctrl+Shift+X` (Windows) or `Cmd+Shift+X` (macOS) to open the Extensions panel, then search for and install:

| Extension | Publisher | Required | Purpose |
|---|---|---|---|
| **C# Dev Kit** | Microsoft | Yes | .NET development, debugging, IntelliSense |
| **Angular Language Service** | Angular | Yes | Angular template IntelliSense and error checking |
| **ESLint** | Microsoft | Yes | TypeScript linting |
| **GitHub Copilot** | GitHub | Recommended | AI-assisted development (uses Copilot prompts and instruction files) |
| **GitHub Copilot Chat** | GitHub | Recommended | Copilot chat with agent mode for MCP servers |
| **Docker** | Microsoft | Recommended | Docker container management from VS Code |

### GitHub Copilot Setup

If you choose to use GitHub Copilot (recommended — the project includes Copilot prompts and instruction files optimized for it):

1. You need a GitHub Copilot subscription. Options:
   - **Copilot Free**: Limited completions and chat interactions per month
   - **Copilot Pro**: Unlimited completions ($10/month or free for students/educators/open-source)
2. In VS Code, click the Copilot icon in the bottom-right status bar and sign in with your GitHub account
3. The project's `.github/prompts/` and `.github/instructions/` files activate automatically — no configuration needed

### Trust the Workspace

When you first open the project folder in VS Code, it will ask if you trust the authors. Click **Yes, I trust the authors** to enable all features.

---

## 4. Clone the Repository

Open a terminal (in VS Code: `` Ctrl+` ``) and run:

```bash
git clone https://github.com/actionjacksonthegoat-debug/SeventySix.git
cd SeventySix
```

Then open the folder in VS Code:

```bash
code .
```

Or use **File** → **Open Folder** and select the `SeventySix` directory.

---

## 5. Install Project Dependencies

From the `SeventySix` root directory:

```bash
cd SeventySix.Client
npm install
cd ..
```

This installs all Angular, testing, and build dependencies. The first run may take a few minutes.

---

## 6. Configure Secrets

SeventySix uses .NET user secrets to store sensitive values like database passwords, API keys, and SMTP credentials. These are stored locally on your machine and never committed to the repository.

### Initialize Default Secrets

```bash
npm run secrets:init
```

This creates secrets with safe defaults. The output will tell you which values were auto-generated and which need to be replaced.

### Update Secrets with Your Values

After initialization, update the following secrets with your real credentials. Run each command replacing the placeholder values:

**GitHub OAuth** (for social login — requires a GitHub OAuth App):

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - Application name: `SeventySix Local`
   - Homepage URL: `https://localhost:4200`
   - Authorization callback URL: `https://localhost:7180/api/v1/oauth/github/callback`
4. Click **Register application**
5. Copy the **Client ID** from the app page
6. Click **Generate a new client secret** and copy the secret

```bash
npm run secrets:set -- -Key "Auth:OAuth:Providers:0:ClientId" -Value "your-github-client-id"
npm run secrets:set -- -Key "Auth:OAuth:Providers:0:ClientSecret" -Value "your-github-client-secret"
```

**Brevo Email** (if you created a Brevo account in Step 1):

```bash
npm run secrets:set -- -Key "Email:SmtpUsername" -Value "your-brevo-smtp-login"
npm run secrets:set -- -Key "Email:SmtpPassword" -Value "your-brevo-smtp-key"
npm run secrets:set -- -Key "Email:FromAddress" -Value "noreply@yourdomain.com"
```

**Admin Account** (the seeded admin user — change the password to something personal):

```bash
npm run secrets:set -- -Key "AdminSeeder:Email" -Value "your-admin-email@example.com"
npm run secrets:set -- -Key "AdminSeeder:InitialPassword" -Value "YourSecurePassword123!"
```

**Grafana Dashboard** (optional — change from defaults if you want):

```bash
npm run secrets:set -- -Key "Grafana:AdminUser" -Value "admin"
npm run secrets:set -- -Key "Grafana:AdminPassword" -Value "your-grafana-password"
```

**pgAdmin** (optional — change from defaults if you want):

```bash
npm run secrets:set -- -Key "PgAdmin:DefaultEmail" -Value "your-email@example.com"
npm run secrets:set -- -Key "PgAdmin:DefaultPassword" -Value "your-pgadmin-password"
```

### Verify Your Secrets

```bash
npm run secrets:list
```

This displays all configured secrets. Verify that the GitHub OAuth, Email, and Admin values show your real credentials, not the placeholders.

---

## 7. Set Up Optional Services

### GitHub OAuth App

Already covered in Step 6 above. Without this, the "Login with GitHub" button on the login page will not work, but email/password login will function normally.

### MaxMind GeoIP

If you created a MaxMind account, add the credentials to `docker-compose.override.yml` or set environment variables. Without this, the `geoipupdate` service will log errors but everything else works.

---

## 8. Generate Certificates

The application uses HTTPS everywhere, even in development. Two certificates are needed:

### SSL Certificate (for HTTPS)

```bash
npm run generate:ssl-cert
```

This generates a self-signed certificate for `localhost`. Your browser will show a security warning the first time — this is expected for self-signed certificates. Click **Advanced** → **Proceed** to continue.

### Data Protection Certificate

```bash
npm run generate:dataprotection-cert
```

This generates the certificate used by .NET's Data Protection API to encrypt sensitive data at rest.

---

## 9. Start the Application

Ensure Docker Desktop is running (whale icon in system tray), then:

```bash
npm start
```

This single command:
1. Exports your user secrets as environment variables
2. Starts 13 Docker containers (PostgreSQL, Valkey, Grafana, Jaeger, Prometheus, etc.)
3. Waits for infrastructure health checks
4. Starts the .NET API
5. Starts the Angular development server

The first run downloads Docker images and may take 5–10 minutes. Subsequent starts are much faster.

### What You Should See

The terminal will show progress as services start. When ready, you will see output indicating the Angular dev server is running on port 4200.

---

## 10. Verify Everything Works

Open your browser and visit these URLs:

| Service | URL | What You Should See |
|---|---|---|
| **Application** | `https://localhost:4200` | SeventySix home page with sidebar navigation |
| **API Health** | `https://localhost:7074/health` | JSON with `"status": "Healthy"` |
| **API Docs** | `https://localhost:7074/scalar/v1` | Interactive API documentation |
| **Grafana** | `https://localhost:3443` | Grafana login page (use your Grafana credentials from Step 6) |
| **Jaeger** | `https://localhost:16687` | Jaeger tracing UI |
| **pgAdmin** | `https://localhost:5051` | pgAdmin login (use your pgAdmin credentials from Step 6) |

### Log In

1. Go to `https://localhost:4200/auth/login`
2. Enter the admin email and password you configured in Step 6
3. Complete the Altcha CAPTCHA (click the checkbox — it runs a proof-of-work challenge)
4. On first login, you will be prompted to change your password
5. After password change, log in again with the new password
6. You should now see the full navigation sidebar including the **Management** section

### Development Admin User

A seeded administrator account is automatically created on first startup in development:

| Field | Value |
|-------|-------|
| Username | `admin` |
| Email | `admin@seventysix.local` |
| Password | Set via `AdminSeeder:InitialPassword` user secret |
| First Login | Requires mandatory password change |

This account is created by `AdminSeederService` and is **not** created in production environments.
To set the password: `npm run secrets:set -- AdminSeeder:InitialPassword "YourSecurePassword"`

### Terminal Font Recommendation

For proper Unicode rendering (checkmarks, box-drawing characters):

| OS | Recommended Font |
|----|-----------------|
| Windows | [Cascadia Code](https://github.com/microsoft/cascadia-code) (ships with Windows Terminal) |
| Linux | `Noto Sans Mono` or `DejaVu Sans Mono` |

VS Code terminal font is configured in `.vscode/settings.json` with a fallback chain.

---

## 11. Configure MCP Servers (Optional)

MCP servers give VS Code's Copilot agent mode access to external tools — GitHub PRs, browser automation, database queries, live documentation, and design files.

This project uses MCP servers, all 100% free with zero billing risk.

For complete MCP server setup instructions, see the [MCP Server Setup Guide](MCP-Server-Setup.md).

---

## Optional Feature Flags

The following features are fully optional and can be disabled via `appsettings.Development.json` — no code changes required. Create or update `SeventySix.Server/SeventySix.Api/appsettings.Development.json` with one or more of these overrides:

| Feature | Setting key | Default | Effect when `false` |
|---------|------------|---------|---------------------|
| MFA (email OTP) | `Mfa.Enabled` | `true` | Login requires only email + password — no email code sent |
| MFA enforced globally | `Mfa.RequiredForAllUsers` | `true` | MFA becomes opt-in per user rather than mandatory |
| TOTP authenticator app | `Totp.Enabled` | `true` | TOTP enrollment page hidden; apps cannot be added |
| OAuth / External Auth | `Auth.OAuth.Enabled` | `false` | OAuth login hidden; only changes if provider secrets are set |

### Minimal local setup (no email or OAuth required)

To run the full application without Brevo SMTP credentials or OAuth app keys:

```json
{
  "Mfa": { "Enabled": false, "RequiredForAllUsers": false },
  "Totp": { "Enabled": false }
}
```

With these overrides:
- Email login works without any email being sent (no MFA code step)
- TOTP authenticator enrollment is hidden
- OAuth is already off by default — it only activates when provider secrets are present in user secrets

> **Important**: These are development-only overrides for `appsettings.Development.json`. In production, MFA and TOTP should remain enabled for security. Do not disable them in `appsettings.Production.json`.

---

## Troubleshooting

### Docker containers won't start

1. Make sure Docker Desktop is running (whale icon in system tray)
2. Check available disk space — Docker images need several GB
3. Try restarting Docker Desktop
4. Run `npm run clean:docker` to remove old containers, then `npm start` again

### "Port already in use" errors

Another process is using a required port. Stop it or run:

```bash
npm stop
```

Then try `npm start` again.

### SSL certificate warnings in browser

This is expected for self-signed certificates. In Chrome:
1. Click **Advanced**
2. Click **Proceed to localhost (unsafe)**

In Firefox:
1. Click **Advanced**
2. Click **Accept the Risk and Continue**

### API health check fails

1. Check Docker containers are running: open Docker Desktop and look for green indicators
2. Check API logs: `docker logs seventysix-api`
3. Ensure user secrets are configured: `npm run secrets:list`

### "Secrets not found" or API won't start

Run `npm run secrets:init` again to reinitialize defaults, then re-apply your custom values from Step 6.

### npm install fails

1. Make sure Node.js 22+ is installed: `node --version`
2. Delete `node_modules` and retry:

   ```bash
   cd SeventySix.Client
   rm -rf node_modules
   npm install
   ```

### dotnet build fails

1. Make sure .NET 10 SDK is installed: `dotnet --version`
2. The build requires the SDK, not just the Runtime — reinstall if you see version mismatch errors

### Brevo emails not sending

1. Verify your SMTP credentials: `npm run secrets:list` — check `Email:SmtpUsername` and `Email:SmtpPassword`
2. Check the API logs for email errors: `docker logs seventysix-api | findstr Email`
3. Without valid Brevo credentials, registration and password reset flows will complete but the verification email will not arrive

### MFA code not arriving

If you have Brevo configured, the MFA code is sent via email. Check your inbox (and spam folder). If Brevo is not configured, you can query the email queue directly using pgAdmin at `https://localhost:5051`.
