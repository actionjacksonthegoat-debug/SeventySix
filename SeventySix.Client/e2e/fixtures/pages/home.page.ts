// <copyright file="home.page.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { Page, Locator } from "@playwright/test";
import { SELECTORS } from "../selectors.constant";

/**
 * Home page helper for feature card interactions.
 * Encapsulates common home page operations.
 */
export class HomePageHelper
{
	readonly page: Page;
	readonly featureCards: Locator;
	readonly pageHeading: Locator;
	readonly subtitle: Locator;

	/**
	 * Creates home page helper.
	 * @param page
	 * Playwright page instance.
	 */
	constructor(page: Page)
	{
		this.page = page;
		this.featureCards = page.locator(SELECTORS.home.featureCard);
		this.pageHeading = page.locator(SELECTORS.layout.pageHeading);
		this.subtitle = page.locator(SELECTORS.home.subtitle);
	}

	/**
	 * Gets a feature card by index.
	 * @param cardIndex
	 * Zero-based card index.
	 * @returns
	 * Locator for the card.
	 */
	getCard(cardIndex: number): Locator
	{
		return this.featureCards.nth(cardIndex);
	}

	/**
	 * Gets card title text by index.
	 * @param cardIndex
	 * Zero-based card index.
	 * @returns
	 * Locator for the card title.
	 */
	getCardTitle(cardIndex: number): Locator
	{
		return this.getCard(cardIndex)
			.locator(SELECTORS.home.cardTitle);
	}

	/**
	 * Gets card content text by index.
	 * @param cardIndex
	 * Zero-based card index.
	 * @returns
	 * Locator for the card content.
	 */
	getCardContent(cardIndex: number): Locator
	{
		return this.getCard(cardIndex)
			.locator(SELECTORS.home.cardContent);
	}

	/**
	 * Gets card action text by index.
	 * @param cardIndex
	 * Zero-based card index.
	 * @returns
	 * Locator for the card action text.
	 */
	getCardAction(cardIndex: number): Locator
	{
		return this.getCard(cardIndex)
			.locator(SELECTORS.home.cardActionText);
	}

	/**
	 * Gets card icon by index.
	 * @param cardIndex
	 * Zero-based card index.
	 * @returns
	 * Locator for the card icon.
	 */
	getCardIcon(cardIndex: number): Locator
	{
		return this.getCard(cardIndex)
			.locator(SELECTORS.home.featureIcon);
	}

	/**
	 * Gets card action icon by index.
	 * @param cardIndex
	 * Zero-based card index.
	 * @returns
	 * Locator for the card action icon.
	 */
	getCardActionIcon(cardIndex: number): Locator
	{
		return this.getCard(cardIndex)
			.locator(SELECTORS.home.cardActionIcon);
	}

	/**
	 * Clicks a feature card by index.
	 * @param cardIndex
	 * Zero-based card index.
	 */
	async clickCard(cardIndex: number): Promise<void>
	{
		await this.getCard(cardIndex).click();
	}

	/**
	 * Gets count of feature cards.
	 * @returns
	 * Number of feature cards visible.
	 */
	async getCardCount(): Promise<number>
	{
		return this.featureCards.count();
	}
}
