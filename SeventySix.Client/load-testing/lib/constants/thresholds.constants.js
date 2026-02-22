/**
 * Threshold Constants
 * Common threshold definitions for scenario options.
 */

export const THRESHOLDS =
	Object.freeze(
		{
			FAST: {
				http_req_duration: ["p(95)<500"],
				http_req_failed: ["rate<0.01"]
			},
			STANDARD: {
				http_req_duration: ["p(95)<1000"],
				http_req_failed: ["rate<0.01"]
			},
			RELAXED: {
				http_req_duration: ["p(95)<1200"],
				http_req_failed: ["rate<0.05"]
			},
			SLOW: {
				http_req_duration: ["p(95)<1500"],
				http_req_failed: ["rate<0.05"]
			},
			PERMISSIVE: {
				http_req_duration: ["p(95)<1500"],
				http_req_failed: ["rate<0.10"]
			},
			HEALTH: {
				http_req_duration: ["p(95)<200"],
				http_req_failed: ["rate<0.01"]
			},
			BATCH: {
				http_req_duration: ["p(95)<800"],
				http_req_failed: ["rate<0.01"]
			},
			AUTH: {
				http_req_duration: ["p(95)<800", "p(99)<1200"],
				http_req_failed: ["rate<0.01"]
			}
		});
