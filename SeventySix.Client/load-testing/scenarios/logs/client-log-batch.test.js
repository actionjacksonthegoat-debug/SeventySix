/**
 * Batch Client Log Load Test
 *
 * Tests batch client error logging endpoint.
 * Flow: POST /logs/client/batch (array of log entries)
 * Validates: 204 response
 * Tests: Database write throughput under high batch volume
 */

import { sleep } from "k6";
import http from "k6/http";
import { warmup } from "../../lib/auth.js";
import { buildBatchClientLogPayload } from "../../lib/builders/index.js";
import { isStatus204 } from "../../lib/checks.js";
import { CONFIG, getOptions } from "../../lib/config.js";
import {
	BATCH_SIZE,
	buildTags,
	CONTENT_TYPE,
	FLOW_TAGS,
	HTTP_HEADER,
	LOG_ENDPOINTS,
	OPERATION_TAGS,
	SLEEP_DURATION,
	THRESHOLDS
} from "../../lib/constants/index.js";
import { createSummaryHandler } from "../../lib/summary.js";

export const options =
	getOptions(THRESHOLDS.BATCH);

/**
 * Warm up the API connection so cold-start latency is excluded from metrics.
 */
export function setup()
{
	warmup();
}

export default function()
{
	const logs =
		buildBatchClientLogPayload(BATCH_SIZE.LOG);

	const response =
		http.post(
			`${CONFIG.apiUrl}${LOG_ENDPOINTS.CLIENT_BATCH}`,
			JSON.stringify(logs),
			{
				headers: { [HTTP_HEADER.CONTENT_TYPE]: CONTENT_TYPE.JSON },
				...buildTags(
					FLOW_TAGS.LOGS,
					OPERATION_TAGS.CLIENT_LOG_BATCH)
			});

	isStatus204(response);

	sleep(SLEEP_DURATION.SHORT);
}

export const handleSummary =
	createSummaryHandler("client-log-batch-test");
