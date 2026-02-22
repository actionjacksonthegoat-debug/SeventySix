import { environment } from "@environments/environment";
import { describe, it } from "vitest";

/** Type for test implementation callback compatible with Vitest */
type TestCallback = () => void | Promise<void>;

/**
 * Helper function to conditionally run integration tests based on environment configuration
 *
 * Usage in test files:
 *
 * import { describeIntegration, itIntegration } from '@testing/integration-test.helper';
 *
 * // Conditionally run entire test suite
 * describeIntegration('My Integration Tests', () => {
 *   it('should test integration', () => {
 *     // test code
 *   });
 * });
 *
 * // Conditionally run individual test
 * describe('My Tests', () => {
 *   itIntegration('should test integration', () => {
 *     // test code
 *   });
 * });
 *
 * @param {string} description
 * Test suite description
 * @param {() => void} specDefinitions
 * Test suite implementation
 */
export function describeIntegration(
	description: string,
	specDefinitions: () => void): void
{
	if (environment.testing.runIntegrationTests)
	{
		describe(description, specDefinitions);
	}
	else
	{
		// Skip entire suite when integration tests are disabled
		describe.skip(`[SKIPPED] ${description}`, specDefinitions);
	}
}

/**
 * Helper function to conditionally run individual integration tests
 *
 * @param {string} expectation
 * Test expectation description
 * @param {TestCallback | undefined} assertion
 * Test implementation
 * @param {number | undefined} timeout
 * Optional timeout in milliseconds
 */
export function itIntegration(
	expectation: string,
	assertion?: TestCallback,
	timeout?: number): void
{
	if (environment.testing.runIntegrationTests)
	{
		it(expectation, assertion, timeout);
	}
	else
	{
		// Skip individual test when integration tests are disabled
		it.skip(`[SKIPPED] ${expectation}`, assertion, timeout);
	}
}

/**
 * Helper function to conditionally focus on integration test suite
 *
 * @param {string} description
 * Test suite description
 * @param {() => void} specDefinitions
 * Test suite implementation
 */
export function fdescribeIntegration(
	description: string,
	specDefinitions: () => void): void
{
	if (environment.testing.runIntegrationTests)
	{
		describe.only(description, specDefinitions);
	}
	else
	{
		describe.skip(`[SKIPPED] ${description}`, specDefinitions);
	}
}

/**
 * Helper function to conditionally focus on individual integration test
 *
 * @param {string} expectation
 * Test expectation description
 * @param {TestCallback | undefined} assertion
 * Test implementation
 * @param {number | undefined} timeout
 * Optional timeout in milliseconds
 */
export function fitIntegration(
	expectation: string,
	assertion?: TestCallback,
	timeout?: number): void
{
	if (environment.testing.runIntegrationTests)
	{
		it.only(expectation, assertion, timeout);
	}
	else
	{
		it.skip(`[SKIPPED] ${expectation}`, assertion, timeout);
	}
}

/**
 * Check if integration tests should run
 * Useful for conditional test setup
 *
 * @returns {boolean}
 * True if integration tests are enabled
 */
export function shouldRunIntegrationTests(): boolean
{
	return environment.testing.runIntegrationTests;
}