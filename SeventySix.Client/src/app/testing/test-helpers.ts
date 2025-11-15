/**
 * Test Helpers and Utilities
 * Shared testing utilities for Angular components and services
 */

import { DebugElement } from "@angular/core";
import { ComponentFixture } from "@angular/core/testing";
import { By } from "@angular/platform-browser";

/**
 * Find element by CSS selector
 */
export function findByCss<T>(
	fixture: ComponentFixture<T>,
	selector: string
): DebugElement
{
	return fixture.debugElement.query(By.css(selector));
}

/**
 * Find all elements by CSS selector
 */
export function findAllByCss<T>(
	fixture: ComponentFixture<T>,
	selector: string
): DebugElement[]
{
	return fixture.debugElement.queryAll(By.css(selector));
}

/**
 * Get native element from fixture
 */
export function getNativeElement<T>(
	fixture: ComponentFixture<T>,
	selector: string
): HTMLElement | null
{
	const debugElement: DebugElement = findByCss(fixture, selector);
	return debugElement ? debugElement.nativeElement : null;
}

/**
 * Get text content from element
 */
export function getTextContent<T>(
	fixture: ComponentFixture<T>,
	selector: string
): string
{
	const element: HTMLElement | null = getNativeElement(fixture, selector);
	return element ? element.textContent?.trim() || "" : "";
}

/**
 * Click element
 */
export function clickElement<T>(
	fixture: ComponentFixture<T>,
	selector: string
): void
{
	const element: HTMLElement | null = getNativeElement(fixture, selector);
	if (element)
	{
		element.click();
		fixture.detectChanges();
	}
}

/**
 * Set input value and trigger events
 */
export function setInputValue<T>(
	fixture: ComponentFixture<T>,
	selector: string,
	value: string
): void
{
	const input: HTMLInputElement | null = getNativeElement(
		fixture,
		selector
	) as HTMLInputElement;
	if (input)
	{
		input.value = value;
		input.dispatchEvent(new Event("input"));
		input.dispatchEvent(new Event("blur"));
		fixture.detectChanges();
	}
}

/**
 * Wait for async operations
 */
export async function waitForAsync(ms: number = 0): Promise<void>
{
	return new Promise((resolve) => setTimeout(resolve, ms));
}
