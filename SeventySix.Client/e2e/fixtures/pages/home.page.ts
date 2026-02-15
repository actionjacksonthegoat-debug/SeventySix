// <copyright file="home.page.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { Page, Locator } from "@playwright/test";
import { SELECTORS } from "../selectors.constant";

/**
 * Home page helper for landing page interactions.
 * Encapsulates common home page operations.
 */
export class HomePageHelper
{
	readonly page: Page;
	readonly heroSection: Locator;
	readonly heroTitle: Locator;
	readonly heroTagline: Locator;
	readonly techStackSection: Locator;
	readonly statsBar: Locator;
	readonly featuresSection: Locator;
	readonly architectureSection: Locator;
	readonly ctaFooter: Locator;

	/**
	 * Creates home page helper.
	 * @param page
	 * Playwright page instance.
	 */
	constructor(page: Page)
	{
		this.page = page;
		this.heroSection = page.locator(SELECTORS.home.heroSection);
		this.heroTitle = page.locator(SELECTORS.home.heroTitle);
		this.heroTagline = page.locator(SELECTORS.home.heroTagline);
		this.techStackSection = page.locator(SELECTORS.home.techStackSection);
		this.statsBar = page.locator(SELECTORS.home.statsBar);
		this.featuresSection = page.locator(SELECTORS.home.featuresSection);
		this.architectureSection = page.locator(SELECTORS.home.architectureSection);
		this.ctaFooter = page.locator(SELECTORS.home.ctaFooter);
	}

	/**
	 * Gets all tech category elements.
	 * @returns
	 * Locator for tech category elements.
	 */
	getTechCategories(): Locator
	{
		return this.page.locator(SELECTORS.home.techCategory);
	}

	/**
	 * Gets all stat item elements.
	 * @returns
	 * Locator for stat item elements.
	 */
	getStatItems(): Locator
	{
		return this.page.locator(SELECTORS.home.statItem);
	}

	/**
	 * Gets all feature article elements.
	 * @returns
	 * Locator for feature article elements.
	 */
	getFeatureArticles(): Locator
	{
		return this.page.locator(SELECTORS.home.featureArticle);
	}

	/**
	 * Gets all architecture card elements.
	 * @returns
	 * Locator for architecture card elements.
	 */
	getArchCards(): Locator
	{
		return this.page.locator(SELECTORS.home.archCard);
	}

	/**
	 * Gets the clone command element in the CTA footer.
	 * @returns
	 * Locator for the clone command element.
	 */
	getCloneCommand(): Locator
	{
		return this.page.locator(SELECTORS.home.ctaCloneCommand);
	}
}