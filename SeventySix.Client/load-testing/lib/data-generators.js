/**
 * Unique Test Data Factories
 *
 * All generated data uses the `loadtest_` prefix for identification.
 * Combines timestamp + random integer for uniqueness across VUs.
 *
 * @example
 * import { generateUsername, generateEmail, generatePassword } from "../lib/data-generators.js";
 * const username = generateUsername();
 */

import { RANDOM_INT_MAX } from "./constants/index.js";

/**
 * Generates a random integer between 0 and RANDOM_INT_MAX - 1.
 *
 * @returns {number}
 * Random integer.
 */
function randomInt()
{
	const buffer =
		new Uint32Array(1);
	crypto.getRandomValues(buffer);
	return buffer[0] % RANDOM_INT_MAX;
}

/**
 * Generates a unique username with loadtest_ prefix.
 *
 * @returns {string}
 * A username like `loadtest_1707840000000_123456`.
 */
export function generateUsername()
{
	return `loadtest_${Date.now()}_${randomInt()}`;
}

/**
 * Generates a unique email with loadtest_ prefix.
 *
 * @returns {string}
 * An email like `loadtest_1707840000000_123456@loadtest.local`.
 */
export function generateEmail()
{
	return `loadtest_${Date.now()}_${randomInt()}@loadtest.local`;
}

/**
 * Generates a compliant password string.
 * Meets typical password policy: uppercase, lowercase, number, special char, 16+ chars.
 *
 * @returns {string}
 * A password string.
 */
export function generatePassword()
{
	return `LoadT3st_P@ss_${randomInt()}!`;
}

/**
 * Generates a unique full name for test users.
 *
 * @returns {string}
 * A display name like `LoadTest User 123456`.
 */
export function generateFullName()
{
	return `LoadTest User ${randomInt()}`;
}
