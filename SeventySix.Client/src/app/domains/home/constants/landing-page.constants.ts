import {
	ArchitectureCard,
	FeatureHighlight,
	StatItem,
	TechStackCategory,
	TechStackItem
} from "@home/models";

// ============================================================================
// EXTERNAL LINKS
// ============================================================================

/** GitHub repository URL — used by CTA footer and hero CTAs. */
export const GITHUB_REPO_URL: string =
	"https://github.com/actionjacksonthegoat-debug/SeventySix";

/** Full `git clone` command pre-formatted for copy-to-clipboard. */
export const GITHUB_CLONE_COMMAND: string =
	"git clone https://github.com/actionjacksonthegoat-debug/SeventySix.git";

// ============================================================================
// TECH STACK
// ============================================================================

const SERVER_TECH: readonly TechStackItem[] =
	[
		{
			name: ".NET 10",
			slug: "dotnet",
			cdnSource: "simpleIcons",
			brandColor: "#512BD4",
			url: "https://dotnet.microsoft.com/",
			license: "MIT",
			description: "Runtime and SDK"
		},
		{
			name: "ASP.NET Core",
			slug: "dotnet",
			cdnSource: "simpleIcons",
			brandColor: "#512BD4",
			url: "https://learn.microsoft.com/aspnet/core/",
			license: "MIT",
			description: "HTTP framework"
		},
		{
			name: "Wolverine",
			slug: "wolverine",
			cdnSource: "simpleIcons",
			brandColor: "#0D6EFD",
			url: "https://wolverine.netlify.app/",
			license: "MIT",
			description: "CQRS message bus",
			useMaterialIcon: true,
			materialIcon: "hub"
		},
		{
			name: "EF Core",
			slug: "dotnet",
			cdnSource: "simpleIcons",
			brandColor: "#512BD4",
			url: "https://learn.microsoft.com/ef/core/",
			license: "MIT",
			description: "ORM and migrations"
		},
		{
			name: "PostgreSQL",
			slug: "postgresql",
			cdnSource: "simpleIcons",
			brandColor: "#4169E1",
			url: "https://www.postgresql.org/",
			license: "PostgreSQL",
			description: "Primary database"
		},
		{
			name: "FusionCache",
			slug: "fusioncache",
			cdnSource: "simpleIcons",
			brandColor: "#FF6B35",
			url: "https://github.com/ZiggyCreatures/FusionCache",
			license: "MIT",
			description: "Two-tier caching",
			useMaterialIcon: true,
			materialIcon: "cached"
		},
		{
			name: "Valkey",
			slug: "redis",
			cdnSource: "simpleIcons",
			brandColor: "#DC382D",
			url: "https://valkey.io/",
			license: "BSD-3-Clause",
			description: "Distributed cache"
		},
		{
			name: "FluentValidation",
			slug: "fluentvalidation",
			cdnSource: "simpleIcons",
			brandColor: "#1E88E5",
			url: "https://docs.fluentvalidation.net/",
			license: "Apache-2.0",
			description: "Request validation",
			useMaterialIcon: true,
			materialIcon: "check_circle"
		},
		{
			name: "Serilog",
			slug: "serilog",
			cdnSource: "simpleIcons",
			brandColor: "#E53935",
			url: "https://serilog.net/",
			license: "Apache-2.0",
			description: "Structured logging",
			useMaterialIcon: true,
			materialIcon: "description"
		},
		{
			name: "OpenAPI + Scalar",
			slug: "openapiinitiative",
			cdnSource: "simpleIcons",
			brandColor: "#6BA539",
			url: "https://scalar.com/",
			license: "MIT",
			description: "API documentation"
		}
	];

const CLIENT_TECH: readonly TechStackItem[] =
	[
		{
			name: "Angular 21",
			slug: "angular",
			cdnSource: "simpleIcons",
			brandColor: "#DD0031",
			url: "https://angular.dev/",
			license: "MIT",
			description: "SPA framework (Zoneless, Signals)"
		},
		{
			name: "TanStack Query",
			slug: "reactquery",
			cdnSource: "simpleIcons",
			brandColor: "#FF4154",
			url: "https://tanstack.com/query/latest",
			license: "MIT",
			description: "Server state management"
		},
		{
			name: "Angular Material",
			slug: "angular",
			cdnSource: "simpleIcons",
			brandColor: "#757575",
			url: "https://material.angular.dev/",
			license: "MIT",
			description: "Material Design 3 components"
		},
		{
			name: "Vitest",
			slug: "vitest",
			cdnSource: "simpleIcons",
			brandColor: "#6E9F18",
			url: "https://vitest.dev/",
			license: "MIT",
			description: "Unit and integration testing"
		},
		{
			name: "Playwright",
			slug: "playwright",
			cdnSource: "simpleIcons",
			brandColor: "#2EAD33",
			url: "https://playwright.dev/",
			license: "Apache-2.0",
			description: "E2E browser automation"
		},
		{
			name: "k6",
			slug: "k6",
			cdnSource: "simpleIcons",
			brandColor: "#7D64FF",
			url: "https://grafana.com/docs/k6/latest/",
			license: "AGPL-3.0",
			description: "Load and performance testing"
		},
		{
			name: "ESLint",
			slug: "eslint",
			cdnSource: "simpleIcons",
			brandColor: "#4B32C3",
			url: "https://eslint.org/",
			license: "MIT",
			description: "Linting with custom rules"
		},
		{
			name: "dprint",
			slug: "dprint",
			cdnSource: "simpleIcons",
			brandColor: "#009485",
			url: "https://dprint.dev/",
			license: "MIT",
			description: "Code formatting",
			useMaterialIcon: true,
			materialIcon: "format_paint"
		},
		{
			name: "Angular PWA",
			slug: "pwa",
			cdnSource: "simpleIcons",
			brandColor: "#5A0FC8",
			url: "https://angular.dev/ecosystem/service-workers",
			license: "MIT",
			description: "Offline support and updates"
		}
	];

const INFRASTRUCTURE_TECH: readonly TechStackItem[] =
	[
		{
			name: "Docker Compose",
			slug: "docker",
			cdnSource: "simpleIcons",
			brandColor: "#2496ED",
			url: "https://docs.docker.com/compose/",
			license: "Apache-2.0",
			description: "Container orchestration"
		},
		{
			name: "nginx",
			slug: "nginx",
			cdnSource: "simpleIcons",
			brandColor: "#009639",
			url: "https://nginx.org/",
			license: "BSD-2-Clause",
			description: "HTTPS reverse proxy"
		},
		{
			name: "Jaeger",
			slug: "jaeger",
			cdnSource: "simpleIcons",
			brandColor: "#60D0E4",
			url: "https://www.jaegertracing.io/",
			license: "Apache-2.0",
			description: "Distributed tracing"
		},
		{
			name: "Prometheus",
			slug: "prometheus",
			cdnSource: "simpleIcons",
			brandColor: "#E6522C",
			url: "https://prometheus.io/",
			license: "Apache-2.0",
			description: "Metrics collection"
		},
		{
			name: "Grafana",
			slug: "grafana",
			cdnSource: "simpleIcons",
			brandColor: "#F46800",
			url: "https://grafana.com/",
			license: "AGPL-3.0",
			description: "Metrics dashboards"
		},
		{
			name: "OpenTelemetry",
			slug: "opentelemetry",
			cdnSource: "simpleIcons",
			brandColor: "#000000",
			url: "https://opentelemetry.io/",
			license: "Apache-2.0",
			description: "Telemetry pipeline"
		},
		{
			name: "Fail2Ban",
			slug: "fail2ban",
			cdnSource: "simpleIcons",
			brandColor: "#C5203E",
			url: "https://www.fail2ban.org/",
			license: "GPL-2.0",
			description: "Intrusion prevention",
			useMaterialIcon: true,
			materialIcon: "shield"
		},
		{
			name: "pgAdmin",
			slug: "postgresql",
			cdnSource: "simpleIcons",
			brandColor: "#4169E1",
			url: "https://www.pgadmin.org/",
			license: "PostgreSQL",
			description: "Database web UI"
		}
	];

/** Grouped technology stack categories (Server, Client, Infrastructure). */
export const TECH_STACK_CATEGORIES: readonly TechStackCategory[] =
	[
		{
			title: "Server",
			icon: "dns",
			items: SERVER_TECH
		},
		{
			title: "Client",
			icon: "web",
			items: CLIENT_TECH
		},
		{
			title: "Infrastructure",
			icon: "cloud",
			items: INFRASTRUCTURE_TECH
		}
	];

// ============================================================================
// STATS
// ============================================================================

/** Project statistics displayed in the animated stats bar. */
export const STAT_ITEMS: readonly StatItem[] =
	[
		{
			value: 1400,
			suffix: "+",
			label: "Server Test Assertions",
			icon: "verified"
		},
		{
			value: 1200,
			suffix: "+",
			label: "Client Test Assertions",
			icon: "check_circle"
		},
		{
			value: 270,
			suffix: "+",
			label: "E2E Test Cases",
			icon: "integration_instructions"
		},
		{
			value: 4,
			suffix: "",
			label: "Load Test Profiles",
			icon: "speed"
		},
		{
			value: 0,
			suffix: "$",
			label: "Paid Dependencies",
			icon: "open_in_new"
		}
	];

// ============================================================================
// FEATURE HIGHLIGHTS
// ============================================================================

/** Feature highlight entries displayed in the alternating layout section. */
export const FEATURE_HIGHLIGHTS: readonly FeatureHighlight[] =
	[
		{
			title: "Enterprise Security",
			icon: "security",
			tagline: "Defense in depth, zero compromises",
			description: "Multi-layered security with Argon2 hashing, Altcha CAPTCHA, MFA via TOTP, GitHub OAuth, Fail2Ban intrusion prevention, and role-based access control.",
			bullets: [
				"Argon2 password hashing via .NET Core Identity",
				"Altcha proof-of-work CAPTCHA — no third-party tracking",
				"MFA with TOTP authenticator apps and backup codes",
				"Fail2Ban with GeoIP blocking and rate-limit monitoring",
				"Role-based access control (User, Developer, Admin)"
			]
		},
		{
			title: "Full Observability",
			icon: "monitoring",
			tagline: "Traces, metrics, and logs — correlated end-to-end",
			description: "OpenTelemetry traces from browser to database, Prometheus metrics with Grafana dashboards, structured Serilog logging with correlation IDs.",
			bullets: [
				"End-to-end distributed traces via Jaeger",
				"Prometheus metrics with pre-provisioned Grafana dashboards",
				"Serilog structured logging with trace correlation IDs",
				"Client-side Web Vitals telemetry",
				"All UIs served via HTTPS through nginx proxy"
			]
		},
		{
			title: "Comprehensive Testing",
			icon: "science",
			tagline: "Four layers of quality gates",
			description: "xUnit server tests, Vitest client tests, Playwright E2E with WCAG scanning, and k6 load tests — all enforced in CI/CD.",
			bullets: [
				"Server: xUnit + NSubstitute + Shouldly + Roslyn analyzers",
				"Client: Vitest with domain isolation validation",
				"E2E: Playwright with role-based fixtures and axe-core a11y",
				"Load: k6 with quick/smoke/load/stress profiles",
				"Architecture tests enforce boundaries automatically"
			]
		},
		{
			title: "AI-Assisted Workflow",
			icon: "smart_toy",
			tagline: "Built with and for GitHub Copilot",
			description: "Structured plan execution, auto-applied instruction files, MCP server integrations, and Copilot-optimized prompts for consistent development.",
			bullets: [
				"Structured /create-plan → /review-plan → /execute-plan workflow",
				"Auto-applied instruction files per file type",
				"MCP servers: GitHub, PostgreSQL, Chrome DevTools, context7",
				"Custom ESLint rules enforcing project conventions",
				"Hot reload for both .NET API and Angular client"
			]
		},
		{
			title: "Production Ready Patterns",
			icon: "architecture",
			tagline: "Clean architecture, domain-driven design",
			description: "Strict Shared ← Domains ← Api dependency flow, bounded contexts with isolated schemas, Wolverine CQRS, and coordinated cache invalidation.",
			bullets: [
				"Clean Architecture with strict dependency flow",
				"Bounded contexts: Identity, Logging, ApiTracking, Notifications",
				"Wolverine CQRS with static handlers",
				"TanStack Query with coordinated cache invalidation",
				"Docker Compose: dev mirrors production 1:1"
			]
		}
	];

// ============================================================================
// ARCHITECTURE CARDS
// ============================================================================

/** Expandable architecture deep-dive cards for patterns and practices. */
export const ARCHITECTURE_CARDS: readonly ArchitectureCard[] =
	[
		{
			title: "Domain-Driven Design",
			icon: "domain",
			shortDescription: "Bounded contexts with isolated schemas, migrations, and DbContexts.",
			details: [
				"Each domain (Identity, Logging, ApiTracking, ElectronicNotifications) owns its database schema",
				"Independent EF Core DbContext per bounded context",
				"Domain events for cross-context communication",
				"Rich domain models with encapsulated business logic"
			],
			keywords: ["DDD", "Bounded Context", "Aggregate Root", "Domain Event"]
		},
		{
			title: "Hexagonal Architecture",
			icon: "hexagon",
			shortDescription: "Ports and adapters pattern with clean dependency inversion.",
			details: [
				"Strict Shared ← Domains ← Api dependency flow — never reversed",
				"Domain layer has zero infrastructure dependencies",
				"Infrastructure concerns injected through abstractions",
				"Database, caching, and external services are swappable adapters"
			],
			keywords: ["Ports & Adapters", "Dependency Inversion", "Clean Architecture"]
		},
		{
			title: "CQRS with Wolverine",
			icon: "call_split",
			shortDescription: "Command/Query separation with static handlers and method injection.",
			details: [
				"Commands and queries are simple record types",
				"Static handlers with method-injected dependencies",
				"No service locator or constructor injection in handlers",
				"Scheduled messaging for background job orchestration"
			],
			keywords: ["CQRS", "Wolverine", "Static Handlers", "Message Bus"]
		},
		{
			title: "Vertical Slices",
			icon: "view_column",
			shortDescription: "Feature-oriented organization from endpoint to database.",
			details: [
				"Each feature contains its own endpoint, handler, validator, and DTO",
				"Minimal cross-feature coupling — changes are localized",
				"FluentValidation validators co-located with handlers",
				"Request pipeline: Endpoint → Wolverine Bus → Handler → Repository"
			],
			keywords: ["Vertical Slices", "Feature Folders", "Minimal Coupling"]
		},
		{
			title: "CI/CD Pipeline",
			icon: "rocket_launch",
			shortDescription: "GitHub Actions with zero-warning enforcement and multi-suite testing.",
			details: [
				"Zero build warnings enforced (server and client)",
				"Four test suites: server, client, E2E, load — all must pass",
				"Architecture tests prevent dependency violations",
				"Docker production build with nginx + .NET multi-stage"
			],
			keywords: ["CI/CD", "GitHub Actions", "Quality Gates", "Docker"]
		},
		{
			title: "Load Testing",
			icon: "speed",
			shortDescription: "k6 performance profiles with Docker-isolated environments.",
			details: [
				"Four profiles: quick (30s), smoke (1m), load (5m), stress (10m)",
				"Docker-isolated environment mirrors production",
				"HTML summary reports with threshold violations",
				"Custom scenarios per API endpoint with realistic data"
			],
			keywords: ["k6", "Performance", "Load Testing", "Grafana"]
		}
	];
