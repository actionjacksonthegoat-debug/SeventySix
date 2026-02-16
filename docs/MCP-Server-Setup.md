# MCP Server Setup Guide

> **Model Context Protocol (MCP)** servers give VS Code's Copilot agent mode access to external tools — GitHub PRs, browser automation, database inspection, and live docs.
>
> This project uses multiple MCP servers. All are **100% free** with **zero billing risk**.

---

## Table of Contents

- [Cost & Licensing Summary](#cost--licensing-summary)
- [Prerequisites](#prerequisites)
- [Server-by-Server Setup](#server-by-server-setup)
    - [1. GitHub](#1-github)
    - [2. PostgreSQL](#2-postgresql)
    - [3. Chrome DevTools](#3-chrome-devtools)
    - [4. Context7](#4-context7)
- [How VS Code Uses These Servers](#how-vs-code-uses-these-servers)
- [Pricing Safety Guarantees](#pricing-safety-guarantees)
- [Troubleshooting](#troubleshooting)
- [Which MCP Server Do I Need?](#which-mcp-server-do-i-need)

---

## Which MCP Server Do I Need?

```mermaid
graph TD
    Start["What are you doing?"]
    Start -->|PR / Issue work| GH["GitHub MCP"]
    Start -->|DB inspection| PG["PostgreSQL MCP"]
    Start -->|Screenshots / DevTools| CD["Chrome DevTools MCP"]
    Start -->|Library docs lookup| C7["Context7 MCP"]
    Start -->|k6 load test docs| C7
    Start -->|E2E test running| CLI["Playwright CLI"]
```

> **Context7** is also the recommended source for k6 documentation when writing or debugging load tests.

---

## Cost & Licensing Summary

| #   | MCP Server          | Package                                 | License    | Cost                        | Credit Card Required? | Any Possible Charge? |
| --- | ------------------- | --------------------------------------- | ---------- | --------------------------- | --------------------- | -------------------- |
| 1   | **GitHub**          | `@modelcontextprotocol/server-github`   | MIT        | Free forever                | No                    | No                   |
| 2   | **PostgreSQL**      | `@modelcontextprotocol/server-postgres` | MIT        | Free forever                | No                    | No                   |
| 3   | **Chrome DevTools** | `chrome-devtools-mcp`                   | Apache-2.0 | Free forever                | No                    | No                   |
| 4   | **Context7**        | `@upstash/context7-mcp`                 | MIT        | Free forever (free tier)    | No                    | No                   |

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

### 2. PostgreSQL

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

### 3. Chrome DevTools

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

### 4. Context7

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

## How VS Code Uses These Servers

MCP servers are configured in `.vscode/mcp.json` (already committed to the repo). When you open the project in VS Code:

1. **MCP servers start on demand** — they are NOT running in the background
2. **VS Code prompts for secrets** the first time each server is activated:
    - GitHub: Personal Access Token
    - PostgreSQL: Connection string
3. **Secrets are stored in VS Code's secure credential store** — not in files
4. Copilot's agent mode automatically discovers available MCP tools

### Security: No Secrets in Committed Files

The `.vscode/mcp.json` file is committed to the repo but contains **zero secrets**. Sensitive values are handled as follows:

| Secret                  | Method                | Stored In                       |
| ----------------------- | --------------------- | ------------------------------- |
| GitHub Token            | `${input:}` prompt    | VS Code secure credential store |
| PostgreSQL Conn. String | `${input:}` prompt    | VS Code secure credential store |

- GitHub and PostgreSQL secrets use `${input:variableName}` placeholders — VS Code prompts at activation and securely stores them
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
| `new-component.prompt.md`       | context7                              |
| `new-angular-service.prompt.md` | context7                              |
| `new-service.prompt.md`         | context7, postgresql                  |
| `new-feature.prompt.md`         | context7, postgresql                  |
| `new-e2e-test.prompt.md`        | context7, chrome-devtools             |

---

## Pricing Safety Guarantees

### How to Ensure You Are NEVER Charged

| Rule                                  | Details                                                                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Never enter a credit card**         | None of these services require one for the features we use                                                                    |

| **Never create an Upstash account**   | Context7 free tier needs no account. Only create one if you want higher rate limits (and even then, Upstash has a free tier). |
| **Never generate a Context7 API key** | Without a key, you cannot be charged. Period.                                                                                 |
| **GitHub stays free**                 | GitHub API at 5,000 req/hour is free for all account types                                                                    |
| **All local servers cost nothing**    | Chrome DevTools and PostgreSQL run entirely on your machine                                                                    |

### What Happens If You Hit Rate Limits?

| Server          | Rate Limit               | What Happens                               |
| --------------- | ------------------------ | ------------------------------------------ |
| GitHub          | 5,000 req/hour           | Request returns HTTP 403. Wait ~1 minute.  |
| Context7        | Undisclosed (free tier)  | Request fails with error. Try again later. |

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
