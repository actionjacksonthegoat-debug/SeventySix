/**
 * Update User Load Test
 *
 * Admin user update under concurrent load.
 * Setup: Login as admin → create one test user per VU to avoid concurrent update contention
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
 * @returns {{ accessToken: string, users: Array<{id: number, username: string, email: string}> } | null}
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

	// Create one test user per VU to prevent concurrent update contention.
	// Each VU owns its own user record; no identity ConcurrencyStamp conflicts occur.
	const users =
		[];

	for (let i = 0; i < CONFIG.vus; i++)
	{
		const createResponse =
			authenticatedPost(
				`${CONFIG.apiUrl}${USER_ENDPOINTS.BASE}`,
				authData.accessToken,
				buildCreateUserPayload());

		if (createResponse.status !== HTTP_STATUS.CREATED)
		{
			console.error(`Setup failed: could not create test user ${i + 1}`);
			return null;
		}

		const user =
			createResponse.json();

		users.push(
			{
				id: user.id,
				username: user.username,
				email: user.email,
			});
	}

	return {
		accessToken: authData.accessToken,
		users,
	};
}

export default function(data)
{
	if (isSetupInvalid(data))
	{
		return;
	}

	// Each VU uses its own dedicated user - no concurrent writes to the same record
	const user =
		data.users[(__VU - 1) % data.users.length];

	const response =
		authenticatedPut(
			`${CONFIG.apiUrl}${USER_ENDPOINTS.BASE}/${user.id}`,
			data.accessToken,
			buildUpdateUserPayload(
				user.id,
				user.username,
				user.email),
			buildTags(
				FLOW_TAGS.USERS,
				OPERATION_TAGS.UPDATE));

	isStatus200(response);

	sleep(SLEEP_DURATION.STANDARD);
}

export const handleSummary =
	createSummaryHandler("update-user-test");
