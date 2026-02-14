/**
 * Update User Load Test
 *
 * Admin user update under concurrent load.
 * Setup: Login as admin → create a test user → store ID
 * Flow: PUT /users/{id} (update full name)
 * Validates: 200 response
 */

import { sleep } from "k6";
import { loginAsAdmin } from "../../lib/auth.js";
import { buildCreateUserPayload, buildUpdateUserPayload } from "../../lib/builders/index.js";
import { isStatus200 } from "../../lib/checks.js";
import { CONFIG, getOptions } from "../../lib/config.js";
import {
	buildTags,
	FLOW_TAGS,
	HTTP_STATUS,
	OPERATION_TAGS,
	SLEEP_DURATION,
	THRESHOLDS,
	USER_ENDPOINTS
} from "../../lib/constants/index.js";
import { isSetupInvalid } from "../../lib/guards.js";
import { authenticatedPost, authenticatedPut } from "../../lib/http-helpers.js";
import { createSummaryHandler } from "../../lib/summary.js";

export const options =
	getOptions(THRESHOLDS.RELAXED);

/**
 * @returns {{ accessToken: string, userId: number } | null}
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

	// Create a test user to update during the test
	const createResponse =
		authenticatedPost(
			`${CONFIG.apiUrl}${USER_ENDPOINTS.BASE}`,
			authData.accessToken,
			buildCreateUserPayload());

	if (createResponse.status !== HTTP_STATUS.CREATED)
	{
		console.error("Setup failed: could not create test user");
		return null;
	}

	const user =
		createResponse.json();

	return {
		accessToken: authData.accessToken,
		userId: user.id,
		username: user.username,
		email: user.email
	};
}

export default function(data)
{
	if (isSetupInvalid(data))
	{
		return;
	}

	const response =
		authenticatedPut(
			`${CONFIG.apiUrl}${USER_ENDPOINTS.BASE}/${data.userId}`,
			data.accessToken,
			buildUpdateUserPayload(
				data.userId,
				data.username,
				data.email),
			buildTags(
				FLOW_TAGS.USERS,
				OPERATION_TAGS.UPDATE));

	isStatus200(response);

	sleep(SLEEP_DURATION.STANDARD);
}

export const handleSummary =
	createSummaryHandler("update-user-test");
