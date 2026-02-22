/**
 * Request Permission Load Test
 *
 * Tests user requesting role permissions under load.
 * Setup: Login as regular user (from E2E seeder)
 * Flow: GET /users/me/available-roles → POST /users/me/permission-requests
 * Validates: 204 response
 */

import { check, sleep } from "k6";
import { loginAsUser } from "../../lib/auth.js";
import { buildPermissionRequestPayload } from "../../lib/builders/index.js";
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
	getOptions(THRESHOLDS.RELAXED);

/**
 * @returns {{ accessToken: string } | null}
 */
export function setup()
{
	const authData =
		loginAsUser();
	if (authData == null)
	{
		console.error("Setup failed: could not login as user");
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

	// Get available roles
	const rolesResponse =
		authenticatedGet(
			`${CONFIG.apiUrl}${PERMISSION_ENDPOINTS.AVAILABLE_ROLES}`,
			data.accessToken,
			buildTags(
				FLOW_TAGS.PERMISSIONS,
				OPERATION_TAGS.GET_AVAILABLE_ROLES));

	isStatus200(rolesResponse);

	// Request a permission (may return 409 if already requested — acceptable under load)
	const body =
		rolesResponse.json();
	if (body != null && Array.isArray(body) && body.length > 0)
	{
		const requestedRole =
			body[0].name ?? body[0].roleName;

		if (requestedRole != null)
		{
			const requestResponse =
				authenticatedPost(
					`${CONFIG.apiUrl}${PERMISSION_ENDPOINTS.MY_REQUESTS}`,
					data.accessToken,
					buildPermissionRequestPayload(
						[requestedRole]),
					buildTags(
						FLOW_TAGS.PERMISSIONS,
						OPERATION_TAGS.REQUEST_PERMISSION));

			check(
				requestResponse,
				{
					"permission request accepted or duplicate": (response) =>
						response.status === HTTP_STATUS.OK
							|| response.status === HTTP_STATUS.NO_CONTENT
							|| response.status === HTTP_STATUS.CONFLICT
				});
		}
	}

	sleep(SLEEP_DURATION.STANDARD);
}

export const handleSummary =
	createSummaryHandler("request-permission-test");
