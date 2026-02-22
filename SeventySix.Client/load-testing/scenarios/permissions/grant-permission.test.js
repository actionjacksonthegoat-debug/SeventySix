/**
 * Grant Permission Load Test
 *
 * Tests admin approving/rejecting permission requests.
 * Setup: Login as admin → get pending requests
 * Flow: POST /users/permission-requests/{id}/approve
 * Validates: 200 or 204 response
 */

import { check, sleep } from "k6";
import { loginAsAdmin } from "../../lib/auth.js";
import { isStatus200 } from "../../lib/checks.js";
import { CONFIG, getOptions } from "../../lib/config.js";
import {
	buildTags,
	FLOW_TAGS,
	HTTP_STATUS,
	OPERATION_TAGS,
	PERMISSION_ENDPOINTS,
	SLEEP_DURATION,
	THRESHOLDS
} from "../../lib/constants/index.js";
import { isSetupInvalid } from "../../lib/guards.js";
import { authenticatedGet, authenticatedPost } from "../../lib/http-helpers.js";
import { createSummaryHandler } from "../../lib/summary.js";

export const options =
	getOptions(THRESHOLDS.PERMISSIVE);

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

	// Get pending permission requests
	const listResponse =
		authenticatedGet(
			`${CONFIG.apiUrl}${PERMISSION_ENDPOINTS.REQUESTS}`,
			data.accessToken,
			buildTags(
				FLOW_TAGS.PERMISSIONS,
				OPERATION_TAGS.LIST_REQUESTS));

	isStatus200(listResponse);

	const requests =
		listResponse.json();
	if (requests != null && Array.isArray(requests) && requests.length > 0)
	{
		// Approve the first pending request
		const requestId =
			requests[0].id;

		const approveResponse =
			authenticatedPost(
				`${CONFIG.apiUrl}${PERMISSION_ENDPOINTS.approveById(requestId)}`,
				data.accessToken,
				null,
				buildTags(
					FLOW_TAGS.PERMISSIONS,
					OPERATION_TAGS.GRANT_PERMISSION));

		check(
			approveResponse,
			{
				"approve permission status is 200 or 204": (response) =>
					response.status === HTTP_STATUS.OK || response.status === HTTP_STATUS.NO_CONTENT
			});
	}

	sleep(SLEEP_DURATION.STANDARD);
}

export const handleSummary =
	createSummaryHandler("grant-permission-test");
