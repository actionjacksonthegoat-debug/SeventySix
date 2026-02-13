# MCP Server Setup Guide

> **Model Context Protocol (MCP)** servers give VS Code's Copilot agent mode access to external tools — GitHub PRs, browser automation, database inspection, live docs, and design files.
>
> This project uses **6 MCP servers**. All are **100% free** with **zero billing risk**.

---

## Table of Contents

- [Cost & Licensing Summary](#cost--licensing-summary)
- [Prerequisites](#prerequisites)
- [Server-by-Server Setup](#server-by-server-setup)
    - [1. GitHub](#1-github)
    - [2. Playwright](#2-playwright)
    - [3. PostgreSQL](#3-postgresql)
    - [4. Chrome DevTools](#4-chrome-devtools)
    - [5. Context7](#5-context7)
    - [6. Figma Developer](#6-figma-developer)
        - [Recommended Free Figma UI Kits](#recommended-free-figma-ui-kits)
- [How VS Code Uses These Servers](#how-vs-code-uses-these-servers)
- [Pricing Safety Guarantees](#pricing-safety-guarantees)
- [Troubleshooting](#troubleshooting)

---

## Cost & Licensing Summary

| #   | MCP Server          | Package                                 | License    | Cost                        | Credit Card Required? | Any Possible Charge? |
| --- | ------------------- | --------------------------------------- | ---------- | --------------------------- | --------------------- | -------------------- |
| 1   | **GitHub**          | `@modelcontextprotocol/server-github`   | MIT        | Free forever                | No                    | No                   |
| 2   | **Playwright**      | `@playwright/mcp`                       | Apache-2.0 | Free forever                | No                    | No                   |
| 3   | **PostgreSQL**      | `@modelcontextprotocol/server-postgres` | MIT        | Free forever                | No                    | No                   |
| 4   | **Chrome DevTools** | `chrome-devtools-mcp`                   | Apache-2.0 | Free forever                | No                    | No                   |
| 5   | **Context7**        | `@upstash/context7-mcp`                 | MIT        | Free forever (free tier)    | No                    | No                   |
| 6   | **Figma Developer** | `figma-developer-mcp`                   | MIT        | Free forever (Starter plan) | No                    | No                   |

> **Bottom line**: No server requires a credit card. No server has an auto-upgrade path. No server makes metered cloud API calls. If you hit a rate limit, the request simply fails — you are never charged.

---

## Prerequisites

Before setting up MCP servers, ensure you have:

| Requirement        | Version | Check Command            |
| ------------------ | ------- | ------------------------ |
| **Node.js**        | v20.19+ | `node --version`         |
| **npm**            | 10+     | `npm --version`          |
| **VS Code**        | 1.100+  | `code --version`         |
| **GitHub Copilot** | Latest  | VS Code Extensions panel |

All MCP servers are launched via `npx` (included with npm) — no global installs needed.

---

## AI Model Compatibility

MCP servers are **tools**, not models. They provide capabilities (GitHub API, browser automation, database queries, etc.) that are available to **whichever AI model** you select in VS Code's Copilot chat.

> **Key point**: You do NOT need to configure MCP servers per-model. Configure them once in `.vscode/mcp.json` and they work with every model.

---

## Server-by-Server Setup

### 1. GitHub

**Purpose**: Fetch PR diffs, changed files, issues, and repository metadata for code review and context.

**What You Need**:

- A GitHub account (free)
- A Personal Access Token (free)

**Setup Steps**:

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Set a descriptive name (e.g., `VS Code MCP - SeventySix`)
4. Select scopes:
    - `repo` (full access to private repos)
    - `read:org` (if your repo is in an organization)
5. Click **Generate token**
6. **Copy the token immediately** — it won't be shown again
7. When VS Code prompts "GitHub Personal Access Token (repo scope required)", paste it

**Rate Limits**: 5,000 requests/hour for authenticated users. More than sufficient for development.

**Pricing Risk**: **NONE.** GitHub API is free for all account types. There is no paid API tier for this usage level.

---

### 2. Playwright

**Purpose**: Browser automation for E2E test debugging — navigate pages, click elements, fill forms, take screenshots.

**What You Need**:

- Nothing. Runs 100% locally.

**Setup Steps**:

1. That's it. No account, no API key, no configuration.
2. The MCP server launches a local Chromium browser when activated.

**Pricing Risk**: **NONE.** Fully open-source, fully local. No cloud services contacted.

---

### 3. PostgreSQL

**Purpose**: Read-only database queries for debugging, schema inspection, and data exploration during development.

**What You Need**:

- A running PostgreSQL instance (local or Docker — included in our `docker-compose.yml`)
- A connection string

**Setup Steps**:

1. Start infrastructure: run the project's Docker Compose (PostgreSQL is included)
2. When VS Code prompts "PostgreSQL connection string", enter your local connection string:

    ```
    postgresql://postgres:TestPassword@localhost:5433/seventysix
    ```

    - `5433` — your Docker Compose maps container port 5432 → host port 5433
    - `postgres` / `TestPassword` — defaults from `manage-user-secrets.ps1 -Action init`
    - If you changed your `Database:Password` user secret, substitute that value

> **NOTE on read-only users**: The dev setup uses a single `postgres` superuser — there is no read-only user. For local development this is fine because the database is a disposable Docker volume. In production or shared environments, create a dedicated read-only PostgreSQL role.

---

### 4. Chrome DevTools

**Purpose**: Live browser inspection — DOM, console logs, network requests, performance tracing, screenshots. Provides 26 tools across 6 categories.

**What You Need**:

- **Google Chrome** browser (free) — Edge is NOT supported

**Setup Steps**:

1. Download and install Chrome from [google.com/chrome](https://www.google.com/chrome)
2. That's it. No account, no API key required.
3. The MCP auto-connects to Chrome or launches a new instance.

**Tool Categories** (26 tools total):

| Category         | Tools | Examples                                                                                            |
| ---------------- | ----- | --------------------------------------------------------------------------------------------------- |
| Input Automation | 8     | `click`, `fill`, `drag`, `hover`, `press_key`, `upload_file`, `fill_form`, `handle_dialog`          |
| Navigation       | 6     | `navigate_page`, `new_page`, `close_page`, `list_pages`, `select_page`, `wait_for`                  |
| Emulation        | 2     | `emulate` (device), `resize_page`                                                                   |
| Performance      | 3     | `start_trace`, `stop_trace`, `analyze_insight`                                                      |
| Network          | 2     | `list_requests`, `get_request`                                                                      |
| Debugging        | 5     | `evaluate_script`, `console_messages`, `take_screenshot`, `take_snapshot`, `accessibility_snapshot` |

**Why Chrome, Not Edge?**
The MCP is built and tested by the Google ChromeDevTools team specifically for Chrome. Edge is Chromium-based but NOT officially supported. The `--executablePath` flag could theoretically point to Edge, but reliability is not guaranteed.

**Telemetry**: Chrome DevTools MCP collects anonymous usage statistics (tool usage frequency, error rates) to help the Google ChromeDevTools team prioritize features. This does **NOT** collect your code, browsing data, or personal information. Telemetry is enabled by default and has no cost implication. If you ever want to opt out, add `--no-usage-statistics` to the args in `.vscode/mcp.json`.

**Pricing Risk**: **NONE.** Open-source, local execution, no cloud calls, no account.

---

### 5. Context7

**Purpose**: Fetches up-to-date, version-specific library documentation directly into Copilot's context. Prevents hallucinated APIs by providing real docs for Angular, .NET, Wolverine, TanStack Query, Playwright, EF Core, and any other library.

**What You Need**:

- Nothing for the free tier. Works without any API key.

**Setup Steps**:

1. That's it. No account, no API key, no configuration.
2. Context7 resolves library IDs and fetches documentation on demand.

**Startup Warning — `CLIENT_IP_ENCRYPTION_KEY`**:

When Context7 starts, you will see this warning in VS Code's output panel:

```
WARNING: Using default CLIENT_IP_ENCRYPTION_KEY.
Context7 Documentation MCP Server v2.x.x running on stdio
```

**This is normal and safe.** Here's what it means:

- Context7's server-side code hashes client IP addresses for rate-limiting purposes
- Without a custom encryption key, it uses a built-in default key
- This only affects how your IP is hashed in Context7's internal logs — NOT your code, files, or queries
- Setting a custom key is only necessary for self-hosted enterprise deployments
- **No action needed** — ignore this warning

**How It Works**:

- Tool 1: `resolve-library-id` — finds the correct library from a name (e.g., "angular" → official Angular docs)
- Tool 2: `get-library-docs` — fetches relevant documentation pages for that library version

**Free Tier Details**:

| Aspect                 | Free Tier                                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| API Key                | Not required                                                                                                                 |
| Rate Limits            | Lower than paid tier (sufficient for individual development)                                                                 |
| What happens at limit? | Requests fail with an error — **you are NOT charged**                                                                        |
| Auto-upgrade?          | **NO.** You must explicitly create an Upstash account, generate a key, and configure it. None of this happens automatically. |

**Pricing Risk**: **NONE.** To ever be charged, you would have to: (1) create an Upstash account, (2) enter payment info, (3) generate an API key, (4) configure it in your environment. Without all 4 steps, you stay on free forever.

---

### 6. Figma Developer

**Purpose**: Paste a Figma design link into VS Code agent mode → the MCP extracts simplified layout and styling metadata → Copilot implements the design using your existing Material Design 3 theme and SCSS tokens.

**What You Need**:

- A **Figma account** (free Starter plan)
- A **Personal Access Token** (free, generated in Figma settings)

**Setup Steps**:

1. **Create a Figma account** at [figma.com/signup](https://www.figma.com/signup)
    - Select the **Starter** plan (free, the default)
    - **DO NOT upgrade** to Professional/Organization/Enterprise
2. **Generate a Personal Access Token**:
    - Click your account avatar (top-left) → **Settings**
    - Select the **Security** tab
    - Scroll to **Personal access tokens** → **Generate new token**
    - Name it (e.g., `VS Code MCP`)
    - Assign scope: **File content (Read-only)**
    - Press Enter
    - **Copy the token immediately** — it only displays once
3. **Add your key to the `.env` file** in the project root:

    ```
    FIGMA_API_KEY=figd_your_token_here
    ```

    - The `.env` file is already in `.gitignore` — your key is never committed
    - If the `.env` file doesn't exist yet, create it at the project root

**How the API Key Is Passed**:

The `figma-developer-mcp` package reads the `FIGMA_API_KEY` from a `.env` file in the working directory (the project root). This file is gitignored, so your key stays local and is never committed to version control.

If the Figma server starts but tools fail with authentication errors, verify that your `.env` file exists at the project root and contains the correct `FIGMA_API_KEY=figd_...` value.

**Figma Starter Plan Details** (the free tier):

| Feature                                | Included?                                 |
| -------------------------------------- | ----------------------------------------- |
| Unlimited drafts                       | Yes                                       |
| Basic design file inspection           | Yes                                       |
| REST API access (what MCP uses)        | Yes                                       |
| Community templates & UI kits          | Yes                                       |
| 150 AI credits/day (Figma AI features) | Yes                                       |
| Dev Mode (advanced inspection)         | No (paid only — but MCP does NOT need it) |

**How It Maps to Your SCSS System**:

When the MCP extracts Figma design metadata, Copilot maps it to your existing tokens:

| Figma Property    | Maps To                                                  | Your File              |
| ----------------- | -------------------------------------------------------- | ---------------------- |
| Spacing/padding   | `$spacing-xs` through `$spacing-4xl`                     | `_variables.scss`      |
| Colors            | `var(--mat-sys-primary)`, `var(--mat-sys-surface)`, etc. | `_material-theme.scss` |
| Typography sizes  | `$font-size-xs` through `$font-size-7xl`                 | `_variables.scss`      |
| Font weights      | `$font-weight-light` through `$font-weight-bold`         | `_variables.scss`      |
| Border radius     | `$border-radius-sm` through `$border-radius-full`        | `_variables.scss`      |
| Shadows/elevation | `@include elevation(sm\|base\|md\|lg\|xl\|2xl)`          | `_mixins.scss`         |
| Hover effects     | `@include elevation-interactive()`                       | `_mixins.scss`         |
| Breakpoints       | `$breakpoint-xs` through `$breakpoint-xl`                | `_variables.scss`      |
| Transitions       | `$transition-duration-*` + `$transition-easing-*`        | `_variables.scss`      |
| Focus states      | `@include focus-visible()`                               | `_variables.scss`      |

**Workflow**:

1. Design in Figma (use free Material Design 3 community kits — see recommendations below)
2. Copy the frame/page link from Figma
3. In VS Code agent mode: `Implement this design: [paste link]`
4. Copilot fetches the design metadata via MCP → generates Angular components using your SCSS tokens

**Recommended Free Figma UI Kits**:

These are the most popular, actively maintained, and fully free community kits on Figma that align with your Angular Material 3 + SCSS stack. All are available via **Figma Community** (no account upgrade needed).

| Kit                                | What It Gives You                                                      | Figma Community Link                                | Why This One                                                                                       |
| ---------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Material Design 3 Kit** (Google) | Official M3 components, color schemes, typography, elevation tokens    | Search "Material 3 Design Kit" in Figma Community   | **The source of truth** — Angular Material 3 components are built from this spec. 28k+ duplicates. |
| **Material You - UI Kit**          | Ready-made screens (dashboards, settings, profiles) built on M3 tokens | Search "Material You UI Kit" in Figma Community     | Pre-built page layouts you can copy and paste links from directly.                                 |
| **Flavor - Dashboard UI Kit**      | Modern admin/dashboard layouts with cards, tables, charts, sidebars    | Search "Flavor Dashboard UI Kit" in Figma Community | Ideal for your `admin` and `developer` domain pages. Clean grid layouts.                           |
| **Flavor - Landing Page UI Kit**   | Hero sections, parallax-ready sections, feature grids, CTAs, footers   | Search "Flavor Landing Page" in Figma Community     | **Parallax and modern landing layouts** — exactly what your `home` domain needs.                   |
| **Flavor - Portfolio UI Kit**      | Portfolio/showcase layouts with image galleries, scroll animations     | Search "Flavor Portfolio" in Figma Community        | Scroll-driven and visual-heavy layouts with modern spacing.                                        |

> **How to use**: Open any kit in Figma Community → click **"Open in Figma"** (free, duplicates to your drafts) → select a frame → right-click → **Copy link** → paste into VS Code agent mode.

**Selecting the Right Kit — Decision Guide**:

| Your Layout Need                  | Recommended Kit                | Key Frames to Copy                         |
| --------------------------------- | ------------------------------ | ------------------------------------------ |
| **Parallax / scroll-driven hero** | Flavor Landing Page            | Hero sections, feature showcases           |
| **Dashboard with cards & tables** | Flavor Dashboard               | Main dashboard, data tables, metrics cards |
| **Component-level reference**     | Material Design 3 Kit (Google) | Buttons, dialogs, navigation, text fields  |
| **Full-page screen mockups**      | Material You UI Kit            | Settings, profiles, onboarding flows       |
| **Image-heavy / portfolio style** | Flavor Portfolio               | Gallery grids, project showcases           |

**Important Notes on Figma Kits**:

- **All kits are free** — they live in Figma Community under the Starter plan
- **No Dev Mode needed** — the MCP reads the design file via REST API, not Dev Mode
- **Your SCSS tokens take priority** — when Copilot generates code from a Figma design, it maps the design's spacing, colors, and typography to YOUR `_variables.scss` and `_material-theme.scss` tokens (see mapping table above). The Figma design is a reference, not a pixel-perfect mandate.
- **Parallax effects** are implemented in Angular with `@HostListener('scroll')` or Intersection Observer — the Figma kit provides the visual layout, Copilot generates the scroll behavior

**Pricing Risk**: **NONE.** Figma Starter is permanently free. To ever be charged, you would have to manually upgrade to Professional ($3-$16/mo), enter a credit card, and confirm the purchase. There is no auto-upgrade, no trial expiration, no hidden limit that triggers billing.

---

## How VS Code Uses These Servers

All 6 servers are configured in `.vscode/mcp.json` (already committed to the repo). When you open the project in VS Code:

1. **MCP servers start on demand** — they are NOT running in the background
2. **VS Code prompts for secrets** the first time each server is activated:
    - GitHub: Personal Access Token
    - PostgreSQL: Connection string
    - Figma: API key
3. **Secrets are stored in VS Code's secure credential store** — not in files
4. Copilot's agent mode automatically discovers available MCP tools

### Security: No Secrets in Committed Files

The `.vscode/mcp.json` file is committed to the repo but contains **zero secrets**. Sensitive values are handled as follows:

| Secret                  | Method                | Stored In                       |
| ----------------------- | --------------------- | ------------------------------- |
| GitHub Token            | `${input:}` prompt    | VS Code secure credential store |
| PostgreSQL Conn. String | `${input:}` prompt    | VS Code secure credential store |
| Figma API Key           | `.env` file (project) | Local `.env` file (gitignored)  |

- GitHub and PostgreSQL secrets use `${input:variableName}` placeholders — VS Code prompts at activation and securely stores them
- Figma's key is stored in the `.env` file at the project root — this file is in `.gitignore` and is never committed
- No secrets are written to `.vscode/`, `.github/`, or any other tracked directory

### Which Prompts/Agents Use Which Servers

| Prompt/Agent                    | MCP Servers Used                      |
| ------------------------------- | ------------------------------------- |
| `code-review.prompt.md`         | github, context7                      |
| `review.md` (agent)             | github, context7, postgresql          |
| `review-plan.prompt.md`         | context7                              |
| `execute-plan.prompt.md`        | context7, postgresql, github          |
| `create-plan.prompt.md`         | context7, postgresql                  |
| `fix-warnings.prompt.md`        | context7                              |
| `new-server-domain.prompt.md`   | context7, postgresql                  |
| `new-client-domain.prompt.md`   | context7                              |
| `new-component.prompt.md`       | context7, figma                       |
| `new-angular-service.prompt.md` | context7                              |
| `new-service.prompt.md`         | context7, postgresql                  |
| `new-feature.prompt.md`         | context7, postgresql, figma           |
| `new-e2e-test.prompt.md`        | context7, playwright, chrome-devtools |

---

## Pricing Safety Guarantees

### How to Ensure You Are NEVER Charged

| Rule                                  | Details                                                                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Never enter a credit card**         | None of these services require one for the features we use                                                                    |
| **Never upgrade Figma**               | Stay on Starter (free). Ignore all "Upgrade" prompts.                                                                         |
| **Never create an Upstash account**   | Context7 free tier needs no account. Only create one if you want higher rate limits (and even then, Upstash has a free tier). |
| **Never generate a Context7 API key** | Without a key, you cannot be charged. Period.                                                                                 |
| **GitHub stays free**                 | GitHub API at 5,000 req/hour is free for all account types                                                                    |
| **All local servers cost nothing**    | Playwright, Chrome DevTools, and PostgreSQL run entirely on your machine                                                      |

### What Happens If You Hit Rate Limits?

| Server          | Rate Limit               | What Happens                               |
| --------------- | ------------------------ | ------------------------------------------ |
| GitHub          | 5,000 req/hour           | Request returns HTTP 403. Wait ~1 minute.  |
| Context7        | Undisclosed (free tier)  | Request fails with error. Try again later. |
| Figma           | ~30 req/minute (Starter) | Request returns HTTP 429. Wait ~1 minute.  |
| Playwright      | None (local)             | N/A                                        |
| Chrome DevTools | None (local)             | N/A                                        |
| PostgreSQL      | None (local)             | N/A                                        |

**In all cases**: rate limit = request fails. You are **never** billed, charged, or auto-upgraded.

---

## Troubleshooting

### "MCP server failed to start"

- Run `node --version` — must be 20.19+
- Run `npx --version` — must be 10+
- Clear npx cache: `npx clear-npx-cache`

### "GitHub token invalid"

- Regenerate at [github.com/settings/tokens](https://github.com/settings/tokens)
- Ensure `repo` scope is selected

### "Figma API key invalid"

- Verify that `.env` exists at the project root with `FIGMA_API_KEY=figd_...`
- Regenerate at Figma > Settings > Security > Personal access tokens
- Ensure **File content (Read-only)** scope is assigned
- Restart VS Code after creating/editing the `.env` file

### "Chrome DevTools can't connect"

- Ensure **Google Chrome** (not Edge) is installed
- Close all Chrome instances and let the MCP launch a fresh one
- Check that no other process is using the Chrome debug port (default: 9222)

### "PostgreSQL connection refused"

- Ensure Docker is running: `docker ps`
- Ensure the database container is up: `docker compose up -d postgres`
- Verify connection string format: `postgresql://postgres:TestPassword@localhost:5433/seventysix`
- Note: dev uses port **5433** (not 5432) — Docker maps 5432 → 5433

### "Context7 rate limited"

- Wait 1-2 minutes and retry
- This is normal on the free tier with heavy usage
- No action needed — you are not being charged

### "Context7: WARNING: Using default CLIENT_IP_ENCRYPTION_KEY"

- This is **not an error** — it's a normal startup message
- Context7 uses a default key for IP address hashing in rate-limit tracking
- It does NOT affect functionality, security, or billing
- **Ignore this warning** — no action needed
