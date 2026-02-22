/**
 * Get Users Paged Load Test
 *
 * Tests the paged user listing endpoint under concurrent reads.
 * This is the heaviest read endpoint — tests OutputCache behavior under load.
 * Setup: Login as admin
 * Flow: GET /users/paged?Page=1&PageSize=25
 * Validates: 200, response body has items array
 */

import { sleep } from "k6";
import { loginAsAdmin } from "../../lib/auth.js";
import { hasPagedItems, isStatus200 } from "../../lib/checks.js";
import { CONFIG, getOptions } from "../../lib/config.js";
import {
	buildTags,
	FLOW_TAGS,
	OPERATION_TAGS,
	PAGINATION,
	SLEEP_DURATION,
	THRESHOLDS,
	USER_ENDPOINTS
} from "../../lib/constants/index.js";
import { isSetupInvalid } from "../../lib/guards.js";
import { authenticatedGet } from "../../lib/http-helpers.js";
import { createSummaryHandler } from "../../lib/summary.js";

export const options =
	getOptions(THRESHOLDS.STANDARD);

/**
 * @returns {{ accessToken: string } | null}
 */
export function setup()
{
	const authData =
		loginAsAdmin();
	if (authData == null)
	{
		console.error("Setup failed: could not login as admin");
		return null;
	}
	return { accessToken: authData.accessToken };
}

export default function(data)
{
	if (isSetupInvalid(data))
	{
		return;
	}

	const response =
		authenticatedGet(
			`${CONFIG.apiUrl}${USER_ENDPOINTS.PAGED}?Page=${PAGINATION.DEFAULT_PAGE}&PageSize=${PAGINATION.DEFAULT_PAGE_SIZE}`,
			data.accessToken,
			buildTags(
				FLOW_TAGS.USERS,
				OPERATION_TAGS.GET_PAGED));

	isStatus200(response);
	hasPagedItems(response);

	sleep(SLEEP_DURATION.STANDARD);
}

export const handleSummary =
	createSummaryHandler("get-users-paged-test");
