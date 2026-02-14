/**
 * Setup Data Guards
 * Shared guard helpers for validating setup data before test iterations.
 */

import { sleep } from "k6";
import { SLEEP_DURATION } from "./constants/index.js";

/**
 * Checks that setup data contains a valid access token.
 * If setup failed, sleeps and returns true (caller should return early).
 *
 * @param {object} data
 * The setup data.
 *
 * @returns {boolean}
 * True if setup data is invalid (caller should return early).
 */
export function isSetupInvalid(data)
{
	if (data == null || data.accessToken == null)
	{
		sleep(SLEEP_DURATION.STANDARD);
		return true;
	}
	return false;
}
