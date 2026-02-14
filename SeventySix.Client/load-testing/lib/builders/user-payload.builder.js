/**
 * User Payload Builders
 * Builds user creation/update payloads with generated test data.
 */

import { generateEmail, generateFullName, generateUsername } from "../data-generators.js";

/**
 * Builds a create user payload with unique test data.
 *
 * @param {object} [overrides]
 * Optional field overrides.
 *
 * @returns {object}
 * A user creation payload object.
 */
export function buildCreateUserPayload(overrides)
{
	return {
		username: generateUsername(),
		email: generateEmail(),
		fullName: generateFullName(),
		isActive: true,
		...overrides
	};
}

/**
 * Builds an update user payload for an existing user.
 *
 * @param {number} userId
 * The user ID.
 *
 * @param {string} username
 * The current username.
 *
 * @param {string} email
 * The current email.
 *
 * @param {object} [overrides]
 * Optional field overrides.
 *
 * @returns {object}
 * A user update payload object.
 */
export function buildUpdateUserPayload(
	userId,
	username,
	email,
	overrides)
{
	return {
		id: userId,
		username: username,
		email: email,
		fullName: generateFullName(),
		isActive: true,
		...overrides
	};
}
