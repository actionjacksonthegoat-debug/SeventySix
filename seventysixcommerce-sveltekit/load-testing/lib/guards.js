/**
 * Test Setup Guards for SvelteKit Load Tests
 *
 * Provides guard functions that validate test setup data
 * before scenarios execute.
 *
 * @example
 * import { isSetupMissing } from "../lib/guards.js";
 * export default function(data) { if (isSetupMissing(data)) return; }
 */

/**
 * Checks if the setup data is missing (null or undefined).
 * When true, the test should skip execution.
 *
 * @param {object} data
 * Setup data returned from the setup() function.
 *
 * @returns {boolean}
 * True if data is missing and test should skip.
 */
export function isSetupMissing(data)
{
	return data === null || data === undefined;
}
