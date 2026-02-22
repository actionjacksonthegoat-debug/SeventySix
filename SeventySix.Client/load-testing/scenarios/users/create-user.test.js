/**
 * Create User Load Test
 *
 * Admin user creation under concurrent load.
 * Setup: Login as admin → store token
 * Flow: POST /users (unique username/email per iteration)
 * Validates: 201 response
 */

import { sleep } from "k6";
import { loginAsAdmin } from "../../lib/auth.js";
import { buildCreateUserPayload } from "../../lib/builders/index.js";
import { isStatus201 } from "../../lib/checks.js";
import { CONFIG, getOptions } from "../../lib/config.js";
import {
	buildTags,
	FLOW_TAGS,
	OPERATION_TAGS,
	SLEEP_DURATION,
	THRESHOLDS,
	USER_ENDPOINTS
} from "../../lib/constants/index.js";
import { isSetupInvalid } from "../../lib/guards.js";
import { authenticatedPost } from "../../lib/http-helpers.js";
import { createSummaryHandler } from "../../lib/summary.js";

export const options =
	getOptions(THRESHOLDS.RELAXED);

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

	const payload =
		buildCreateUserPayload();

	const response =
		authenticatedPost(
			`${CONFIG.apiUrl}${USER_ENDPOINTS.BASE}`,
			data.accessToken,
			payload,
			buildTags(
				FLOW_TAGS.USERS,
				OPERATION_TAGS.CREATE));

	isStatus201(response);

	sleep(SLEEP_DURATION.STANDARD);
}

export const handleSummary =
	createSummaryHandler("create-user-test");
