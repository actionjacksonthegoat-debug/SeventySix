/**
 * Bulk Operations Load Test
 *
 * Tests bulk activate/deactivate under load.
 * Setup: Login as admin → create N test users → store IDs
 * Flow: POST /users/bulk/activate and /users/bulk/deactivate
 * Validates: 200 response
 */

import { sleep } from "k6";
import { loginAsAdmin } from "../../lib/auth.js";
import { buildCreateUserPayload } from "../../lib/builders/index.js";
import { isStatus200 } from "../../lib/checks.js";
import { CONFIG, getOptions } from "../../lib/config.js";
import {
	BATCH_SIZE,
	buildTags,
	FLOW_TAGS,
	HTTP_STATUS,
	OPERATION_TAGS,
	SLEEP_DURATION,
	THRESHOLDS,
	USER_ENDPOINTS
} from "../../lib/constants/index.js";
import { isSetupInvalid } from "../../lib/guards.js";
import { authenticatedPost } from "../../lib/http-helpers.js";
import { createSummaryHandler } from "../../lib/summary.js";

export const options =
	getOptions(THRESHOLDS.SLOW);

/**
 * @returns {{ accessToken: string, userIds: number[] } | null}
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

	const userIds = [];
	for (let index = 0; index < BATCH_SIZE.USER; index++)
	{
		const createResponse =
			authenticatedPost(
				`${CONFIG.apiUrl}${USER_ENDPOINTS.BASE}`,
				authData.accessToken,
				buildCreateUserPayload());

		if (createResponse.status === HTTP_STATUS.CREATED)
		{
			const user =
				createResponse.json();
			userIds.push(user.id);
		}
	}

	if (userIds.length === 0)
	{
		console.error("Setup failed: could not create test users");
		return null;
	}

	return { accessToken: authData.accessToken, userIds: userIds };
}

export default function(data)
{
	if (isSetupInvalid(data) || data.userIds == null)
	{
		sleep(SLEEP_DURATION.STANDARD);
		return;
	}

	// Deactivate all test users
	const deactivateResponse =
		authenticatedPost(
			`${CONFIG.apiUrl}${USER_ENDPOINTS.BULK_DEACTIVATE}`,
			data.accessToken,
			data.userIds,
			buildTags(
				FLOW_TAGS.USERS,
				OPERATION_TAGS.BULK_DEACTIVATE));

	isStatus200(deactivateResponse);

	sleep(SLEEP_DURATION.SHORT);

	// Activate all test users
	const activateResponse =
		authenticatedPost(
			`${CONFIG.apiUrl}${USER_ENDPOINTS.BULK_ACTIVATE}`,
			data.accessToken,
			data.userIds,
			buildTags(
				FLOW_TAGS.USERS,
				OPERATION_TAGS.BULK_ACTIVATE));

	isStatus200(activateResponse);

	sleep(SLEEP_DURATION.STANDARD);
}

export const handleSummary =
	createSummaryHandler("bulk-operations-test");
