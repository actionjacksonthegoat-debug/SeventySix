import { DOCUMENT } from "@angular/common";
import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	inject
} from "@angular/core";
import { Meta } from "@angular/platform-browser";
import {
	ARCHITECTURE_CARDS,
	FEATURE_HIGHLIGHTS,
	GITHUB_CLONE_COMMAND,
	GITHUB_REPO_URL,
	STAT_ITEMS,
	TECH_STACK_CATEGORIES
} from "@home/constants/landing-page.constants";
import {
	ArchitectureCard,
	FeatureHighlight,
	StatItem,
	TechStackCategory
} from "@home/models";
import {
	ArchitectureSectionComponent,
	CtaFooterSectionComponent,
	FeaturesSectionComponent,
	HeroSectionComponent,
	StatsSectionComponent,
	TechStackSectionComponent
} from "@home/pages/landing-page/sections";

/**
 * Landing page component — dual-theme parallax showcase.
 * Orchestrates section sub-components and provides page data from constants.
 *
 * Loaded directly by the HomeComponent wrapper.
 * Injects JSON-LD structured data and meta tags after first render
 * for SEO and social sharing.
 */
@Component(
	{
		selector: "app-landing-page",
		changeDetection: ChangeDetectionStrategy.OnPush,
		host: { class: "full-width-page" },
		imports: [
			HeroSectionComponent,
			TechStackSectionComponent,
			StatsSectionComponent,
			FeaturesSectionComponent,
			ArchitectureSectionComponent,
			CtaFooterSectionComponent
		],
		templateUrl: "./landing-page.html",
		styleUrl: "./landing-page.scss"
	})
export class LandingPageComponent
{
	/**
	 * Reference to the browser `document` for DOM manipulation (structured data injection).
	 * @type {Document}
	 * @private
	 * @readonly
	 */
	private readonly document: Document =
		inject(DOCUMENT);

	/**
	 * Angular Meta service for dynamic `<meta>` tag updates.
	 * @type {Meta}
	 * @private
	 * @readonly
	 */
	private readonly meta: Meta =
		inject(Meta);

	/**
	 * Tech stack categories (Server, Client, Infrastructure) passed to the tech-stack section.
	 * @type {readonly TechStackCategory[]}
	 * @protected
	 * @readonly
	 */
	protected readonly techStackCategories: readonly TechStackCategory[] =
		TECH_STACK_CATEGORIES;

	/**
	 * Feature highlight entries passed to the features section.
	 * @type {readonly FeatureHighlight[]}
	 * @protected
	 * @readonly
	 */
	protected readonly featureHighlights: readonly FeatureHighlight[] = FEATURE_HIGHLIGHTS;

	/**
	 * Animated stats counter items passed to the stats section.
	 * @type {readonly StatItem[]}
	 * @protected
	 * @readonly
	 */
	protected readonly statItems: readonly StatItem[] = STAT_ITEMS;

	/**
	 * Expandable architecture cards passed to the architecture section.
	 * @type {readonly ArchitectureCard[]}
	 * @protected
	 * @readonly
	 */
	protected readonly architectureCards: readonly ArchitectureCard[] = ARCHITECTURE_CARDS;

	/**
	 * GitHub repository URL passed to hero and CTA sections.
	 * @type {string}
	 * @protected
	 * @readonly
	 */
	protected readonly githubRepoUrl: string = GITHUB_REPO_URL;

	/**
	 * `git clone` command string passed to the CTA footer.
	 * @type {string}
	 * @protected
	 * @readonly
	 */
	protected readonly githubCloneCommand: string =
		GITHUB_CLONE_COMMAND;

	constructor()
	{
		afterNextRender(
			() =>
			{
				this.injectStructuredData();
				this.updateMetaTags();
			});
	}

	/**
	 * Injects JSON-LD structured data into the document `<head>`
	 * for search engine and social media rich previews.
	 * Enhanced for 2026 SEO best practices with multiple schema types.
	 */
	private injectStructuredData(): void
	{
		const schemas: object[] =
			[
				this.buildSoftwareSourceCodeSchema(),
				this.buildWebApplicationSchema(),
				this.buildOrganizationSchema(),
				this.buildBreadcrumbSchema()
			];

		schemas.forEach(
			(schema) =>
			{
				const script: HTMLScriptElement =
					this.document.createElement("script");
				script.type = "application/ld+json";
				script.textContent =
					JSON.stringify(schema);
				this.document.head.appendChild(script);
			});
	}

	/**
	 * Builds Schema.org SoftwareSourceCode structured data
	 * with keywords, licensing, and educational metadata.
	 */
	private buildSoftwareSourceCodeSchema(): object
	{
		return {
			"@context": "https://schema.org",
			"@type": "SoftwareSourceCode",
			"name": "SeventySix",
			"description":
				"A full-stack monorepo built with .NET 10 and Angular 21. Secure by default, observable from the start, designed for AI-assisted development. Demonstrates DDD, Hexagonal Architecture, CQRS, Wolverine, TanStack Query, and comprehensive testing patterns.",
			"codeRepository": GITHUB_REPO_URL,
			"programmingLanguage": ["C#", "TypeScript"],
			"license": "https://opensource.org/licenses/MIT",
			"runtimePlatform": [".NET 10", "Angular 21"],
			"applicationCategory": "DeveloperApplication",
			"operatingSystem": "Cross-platform",
			"author": {
				"@type": "Organization",
				"name": "SeventySix Team",
				"url": "https://github.com/actionjacksonthegoat-debug/SeventySix"
			},
			"datePublished": "2025-01-01",
			"inLanguage": "en-US",
			"isAccessibleForFree": true,
			"educationalUse": ["Learning", "Reference", "Training"],
			"learningResourceType": "Code Example",
			"offers": {
				"@type": "Offer",
				"price": "0",
				"priceCurrency": "USD",
				"availability": "https://schema.org/InStock",
				"description": "MIT licensed, free forever. No subscription, no hidden fees, fully open source."
			},
			"keywords": this.buildSoftwareKeywords()
		};
	}

	/** Returns Schema.org keyword list for the SoftwareSourceCode schema. */
	private buildSoftwareKeywords(): string[]
	{
		return [
			"DDD",
			"Domain-Driven Design",
			"Hexagonal Architecture",
			"CQRS",
			"Event Sourcing",
			"Vertical Slices",
			".NET 10",
			"Angular 21",
			"Wolverine",
			"TanStack Query",
			"PostgreSQL",
			"Full-Stack",
			"Monorepo",
			"Clean Architecture",
			"SOLID",
			"TDD",
			"E2E Testing",
			"Load Testing",
			"Observability",
			"OpenTelemetry",
			"Prometheus",
			"Grafana",
			"Material Design 3",
			"PWA",
			"Service Worker",
			"Docker",
			"Kubernetes",
			"CI/CD",
			"GitHub Actions",
			"OAuth",
			"JWT",
			"Security",
			"Accessibility",
			"WCAG AA",
			"MIT License",
			"Open Source"
		];
	}

	/** Builds Schema.org WebApplication structured data. */
	private buildWebApplicationSchema(): object
	{
		return {
			"@context": "https://schema.org",
			"@type": "WebApplication",
			"name": "SeventySix",
			"applicationCategory": "DeveloperApplication",
			"applicationSubCategory": "Full-Stack Framework Example",
			"operatingSystem": "Any",
			"browserRequirements": "Requires JavaScript. Supports modern browsers (Chrome, Firefox, Safari, Edge).",
			"inLanguage": "en-US",
			"isAccessibleForFree": true,
			"offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
		};
	}

	/** Builds Schema.org Organization structured data. */
	private buildOrganizationSchema(): object
	{
		return {
			"@context": "https://schema.org",
			"@type": "Organization",
			"name": "SeventySix",
			"url": "https://seventysix.app",
			"logo": "https://seventysix.app/icons/icon-512x512.png",
			"sameAs": [GITHUB_REPO_URL]
		};
	}

	/** Builds Schema.org BreadcrumbList structured data. */
	private buildBreadcrumbSchema(): object
	{
		return {
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			"itemListElement": [
				{ "@type": "ListItem", "position": 1, "name": "Home", "item": "https://seventysix.app" }
			]
		};
	}

	/**
	 * Updates `<meta>` tags for SEO, Open Graph, and Twitter Card support.
	 * Enhanced for 2026 best practices with AI crawler optimization.
	 * Called once after the first render via `afterNextRender`.
	 */
	private updateMetaTags(): void
	{
		this.updatePrimaryMetaTags();
		this.updateAiCrawlerMetaTags();
		this.updateOpenGraphTags();
		this.updateTwitterCardTags();
		this.updateCanonicalUrl();
	}

	/** Updates primary SEO meta tags: description, keywords, author, robots. */
	private updatePrimaryMetaTags(): void
	{
		this.meta.updateTag(
			{
				name: "description",
				content:
					"SeventySix is a production-ready full-stack monorepo built with .NET 10 and Angular 21. Features DDD, Hexagonal Architecture, CQRS, Wolverine, TanStack Query, comprehensive testing, observability with OpenTelemetry, and Material Design 3. MIT licensed, free forever."
			});

		this.meta.updateTag(
			{
				name: "keywords",
				content:
					"DDD, Domain-Driven Design, Hexagonal Architecture, CQRS, Event Sourcing, Vertical Slices, .NET 10, Angular 21, Wolverine, TanStack Query, PostgreSQL, Full-Stack, Monorepo, Clean Architecture, SOLID, TDD, E2E Testing, Load Testing, Observability, OpenTelemetry, Prometheus, Grafana, Material Design 3, PWA, Service Worker, Docker, Kubernetes, MIT License, Open Source"
			});

		this.meta.updateTag(
			{ name: "author", content: "SeventySix Team" });

		this.meta.updateTag(
			{
				name: "robots",
				content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
			});
	}

	/** Updates AI crawler, licensing, and academic/research meta tags. */
	private updateAiCrawlerMetaTags(): void
	{
		this.meta.updateTag(
			{ name: "dcterms.license", content: "https://opensource.org/licenses/MIT" });
		this.meta.updateTag(
			{ name: "dcterms.rights", content: "MIT License - Free to use, modify, and distribute" });
		this.meta.updateTag(
			{ name: "citation_title", content: "SeventySix: Production-Ready .NET 10 + Angular 21 Full-Stack Monorepo" });
		this.meta.updateTag(
			{ name: "citation_publication_date", content: "2025/01/01" });
		this.meta.updateTag(
			{ name: "citation_language", content: "en" });
	}

	/** Updates Open Graph meta tags for social media previews. */
	private updateOpenGraphTags(): void
	{
		this.meta.updateTag(
			{ property: "og:type", content: "website" });
		this.meta.updateTag(
			{ property: "og:url", content: "https://seventysix.app/" });
		this.meta.updateTag(
			{ property: "og:title", content: "SeventySix - Production-Ready .NET 10 + Angular 21 Monorepo" });
		this.meta.updateTag(
			{
				property: "og:description",
				content:
					"A full-stack monorepo demonstrating DDD, Hexagonal Architecture, CQRS, Wolverine, TanStack Query, and comprehensive testing. MIT licensed, free forever."
			});
		this.meta.updateTag(
			{ property: "og:image", content: "https://seventysix.app/icons/icon-512x512.png" });
		this.meta.updateTag(
			{ property: "og:image:width", content: "512" });
		this.meta.updateTag(
			{ property: "og:image:height", content: "512" });
		this.meta.updateTag(
			{ property: "og:locale", content: "en_US" });
		this.meta.updateTag(
			{ property: "og:site_name", content: "SeventySix" });
	}

	/** Updates Twitter Card meta tags for social media previews. */
	private updateTwitterCardTags(): void
	{
		this.meta.updateTag(
			{ name: "twitter:card", content: "summary_large_image" });
		this.meta.updateTag(
			{ name: "twitter:url", content: "https://seventysix.app/" });
		this.meta.updateTag(
			{ name: "twitter:title", content: "SeventySix - Production-Ready .NET 10 + Angular 21 Monorepo" });
		this.meta.updateTag(
			{
				name: "twitter:description",
				content:
					"A full-stack monorepo demonstrating DDD, Hexagonal Architecture, CQRS, Wolverine, TanStack Query, and comprehensive testing. MIT licensed, free forever."
			});
		this.meta.updateTag(
			{ name: "twitter:image", content: "https://seventysix.app/icons/icon-512x512.png" });
	}

	/** Sets the canonical URL link element for SEO deduplication. */
	private updateCanonicalUrl(): void
	{
		const existingCanonical: HTMLLinkElement | null =
			this.document.querySelector("link[rel=\"canonical\"]");

		if (existingCanonical)
		{
			existingCanonical.href = "https://seventysix.app/";
		}
		else
		{
			const canonical: HTMLLinkElement =
				this.document.createElement("link");
			canonical.rel = "canonical";
			canonical.href = "https://seventysix.app/";
			this.document.head.appendChild(canonical);
		}
	}
}
