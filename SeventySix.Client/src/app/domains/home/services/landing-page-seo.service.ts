/**
 * Landing page SEO service.
 * Injects JSON-LD structured data and meta tags after the first render
 * for SEO and social sharing.
 *
 * Must be provided in route providers — not root-level.
 */

import { DOCUMENT } from "@angular/common";
import { inject, Injectable } from "@angular/core";
import { Meta } from "@angular/platform-browser";
import { GITHUB_REPO_URL } from "@home/constants/landing-page.constants";
import { SITE_CONSTANTS } from "@shared/constants/site.constants";

/**
 * Route-scoped service that manages all SEO concerns for the landing page.
 * Builds JSON-LD structured data and updates meta tags for SEO and social sharing.
 */
@Injectable()
export class LandingPageSeoService
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
	 * Injects JSON-LD structured data and updates all meta tags.
	 * Call once inside `afterNextRender`.
	 * @returns {void}
	 */
	setup(): void
	{
		this.injectStructuredData();
		this.updateMetaTags();
	}

	/**
	 * Injects JSON-LD structured data into the document `<head>`
	 * for search engine and social media rich previews.
	 * Enhanced for 2026 SEO best practices with multiple schema types.
	 * @returns {void}
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
	 * @returns {object}
	 * Schema.org SoftwareSourceCode object.
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

	/**
	 * Returns Schema.org keyword list for the SoftwareSourceCode schema.
	 * @returns {string[]}
	 * Array of technology and concept keywords.
	 */
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

	/**
	 * Builds Schema.org WebApplication structured data.
	 * @returns {object}
	 * Schema.org WebApplication object.
	 */
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

	/**
	 * Builds Schema.org Organization structured data.
	 * @returns {object}
	 * Schema.org Organization object.
	 */
	private buildOrganizationSchema(): object
	{
		return {
			"@context": "https://schema.org",
			"@type": "Organization",
			"name": "SeventySix",
			"url": SITE_CONSTANTS.url,
			"logo": SITE_CONSTANTS.iconUrl,
			"sameAs": [GITHUB_REPO_URL]
		};
	}

	/**
	 * Builds Schema.org BreadcrumbList structured data.
	 * @returns {object}
	 * Schema.org BreadcrumbList object.
	 */
	private buildBreadcrumbSchema(): object
	{
		return {
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			"itemListElement": [
				{ "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_CONSTANTS.url }
			]
		};
	}

	/**
	 * Updates `<meta>` tags for SEO, Open Graph, and Twitter Card support.
	 * Enhanced for 2026 best practices with AI crawler optimization.
	 * Called once after the first render via `afterNextRender`.
	 * @returns {void}
	 */
	private updateMetaTags(): void
	{
		this.updatePrimaryMetaTags();
		this.updateAiCrawlerMetaTags();
		this.updateOpenGraphTags();
		this.updateTwitterCardTags();
		this.updateCanonicalUrl();
	}

	/**
	 * Updates primary SEO meta tags: description, keywords, author, robots.
	 * @returns {void}
	 */
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

	/**
	 * Updates AI crawler, licensing, and academic/research meta tags.
	 * @returns {void}
	 */
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

	/**
	 * Updates Open Graph meta tags for social media previews.
	 * @returns {void}
	 */
	private updateOpenGraphTags(): void
	{
		this.meta.updateTag(
			{ property: "og:type", content: "website" });
		this.meta.updateTag(
			{ property: "og:url", content: `${SITE_CONSTANTS.url}/` });
		this.meta.updateTag(
			{ property: "og:title", content: "SeventySix - Production-Ready .NET 10 + Angular 21 Monorepo" });
		this.meta.updateTag(
			{
				property: "og:description",
				content:
					"A full-stack monorepo demonstrating DDD, Hexagonal Architecture, CQRS, Wolverine, TanStack Query, and comprehensive testing. MIT licensed, free forever."
			});
		this.meta.updateTag(
			{ property: "og:image", content: SITE_CONSTANTS.iconUrl });
		this.meta.updateTag(
			{ property: "og:image:width", content: "512" });
		this.meta.updateTag(
			{ property: "og:image:height", content: "512" });
		this.meta.updateTag(
			{ property: "og:locale", content: "en_US" });
		this.meta.updateTag(
			{ property: "og:site_name", content: "SeventySix" });
	}

	/**
	 * Updates Twitter Card meta tags for social media previews.
	 * @returns {void}
	 */
	private updateTwitterCardTags(): void
	{
		this.meta.updateTag(
			{ name: "twitter:card", content: "summary_large_image" });
		this.meta.updateTag(
			{ name: "twitter:url", content: `${SITE_CONSTANTS.url}/` });
		this.meta.updateTag(
			{ name: "twitter:title", content: "SeventySix - Production-Ready .NET 10 + Angular 21 Monorepo" });
		this.meta.updateTag(
			{
				name: "twitter:description",
				content:
					"A full-stack monorepo demonstrating DDD, Hexagonal Architecture, CQRS, Wolverine, TanStack Query, and comprehensive testing. MIT licensed, free forever."
			});
		this.meta.updateTag(
			{ name: "twitter:image", content: SITE_CONSTANTS.iconUrl });
	}

	/**
	 * Sets the canonical URL link element for SEO deduplication.
	 * @returns {void}
	 */
	private updateCanonicalUrl(): void
	{
		const existingCanonical: HTMLLinkElement | null =
			this.document.querySelector("link[rel=\"canonical\"]");

		if (existingCanonical)
		{
			existingCanonical.href =
				`${SITE_CONSTANTS.url}/`;
		}
		else
		{
			const canonical: HTMLLinkElement =
				this.document.createElement("link");
			canonical.rel = "canonical";
			canonical.href =
				`${SITE_CONSTANTS.url}/`;
			this.document.head.appendChild(canonical);
		}
	}
}