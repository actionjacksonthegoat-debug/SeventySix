import { environment } from "@environments/environment";

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
 * @param description - Test suite description
 * @param specDefinitions - Test suite implementation
 */
export function describeIntegration(
	description: string,
	specDefinitions: () => void
): void
{
	if (environment.testing.runIntegrationTests)
	{
		describe(description, specDefinitions);
	}
	else
	{
		// Skip entire suite when integration tests are disabled
		xdescribe(`[SKIPPED] ${description}`, specDefinitions);
	}
}

/**
 * Helper function to conditionally run individual integration tests
 *
 * @param expectation - Test expectation description
 * @param assertion - Test implementation
 * @param timeout - Optional timeout in milliseconds
 */
export function itIntegration(
	expectation: string,
	assertion?: jasmine.ImplementationCallback,
	timeout?: number
): void
{
	if (environment.testing.runIntegrationTests)
	{
		it(expectation, assertion, timeout);
	}
	else
	{
		// Skip individual test when integration tests are disabled
		xit(`[SKIPPED] ${expectation}`, assertion, timeout);
	}
}

/**
 * Helper function to conditionally focus on integration test suite
 *
 * @param description - Test suite description
 * @param specDefinitions - Test suite implementation
 */
export function fdescribeIntegration(
	description: string,
	specDefinitions: () => void
): void
{
	if (environment.testing.runIntegrationTests)
	{
		fdescribe(description, specDefinitions);
	}
	else
	{
		xdescribe(`[SKIPPED] ${description}`, specDefinitions);
	}
}

/**
 * Helper function to conditionally focus on individual integration test
 *
 * @param expectation - Test expectation description
 * @param assertion - Test implementation
 * @param timeout - Optional timeout in milliseconds
 */
export function fitIntegration(
	expectation: string,
	assertion?: jasmine.ImplementationCallback,
	timeout?: number
): void
{
	if (environment.testing.runIntegrationTests)
	{
		fit(expectation, assertion, timeout);
	}
	else
	{
		xit(`[SKIPPED] ${expectation}`, assertion, timeout);
	}
}

/**
 * Check if integration tests should run
 * Useful for conditional test setup
 *
 * @returns true if integration tests are enabled
 */
export function shouldRunIntegrationTests(): boolean
{
	return environment.testing.runIntegrationTests;
}
