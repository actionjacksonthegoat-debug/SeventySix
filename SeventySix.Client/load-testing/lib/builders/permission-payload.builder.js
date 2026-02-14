/**
 * Permission Payload Builders
 * Builds permission request payloads for permission scenarios.
 */

import { TEST_MESSAGES } from "../constants/index.js";

/**
 * Builds a permission request payload.
 *
 * @param {string[]} requestedRoles
 * The roles to request.
 *
 * @param {object} [overrides]
 * Optional field overrides.
 *
 * @returns {object}
 * A permission request payload object.
 */
export function buildPermissionRequestPayload(
	requestedRoles,
	overrides)
{
	return {
		requestedRoles: requestedRoles,
		requestMessage: TEST_MESSAGES.PERMISSION_REQUEST,
		...overrides
	};
}
