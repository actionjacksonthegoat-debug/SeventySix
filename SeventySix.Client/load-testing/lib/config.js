/**
 * k6 Configuration Loader
 *
 * Reads the profile from __ENV.PROFILE (smoke|load|stress)
 * and merges with default.json for base settings.
 *
 * @example
 * import { CONFIG, getOptions } from "../lib/config.js";
 * export const options = getOptions();
 */

const PROFILE_NAME =
	__ENV.PROFILE ?? "smoke";
const BASE_URL_OVERRIDE =
	__ENV.BASE_URL;

/** @type {object} */
const defaultConfig =
	JSON.parse(open("../config/default.json"));

/** @type {object} */
const profileConfig =
	JSON.parse(open(`../config/${PROFILE_NAME}.json`));

const BASE_URL =
	BASE_URL_OVERRIDE ?? defaultConfig.baseUrl;
const API_URL =
	`${BASE_URL}/api/${defaultConfig.apiVersion}`;

/**
 * Merged configuration object.
 */
export const CONFIG =
	{
		baseUrl: BASE_URL,
		apiUrl: API_URL,
		profile: PROFILE_NAME,
		adminCredentials: defaultConfig.adminCredentials,
		userCredentials: defaultConfig.userCredentials,
		testUserPrefix: defaultConfig.testUserPrefix,
		vus: profileConfig.vus,
		duration: profileConfig.duration,
		iterations: profileConfig.iterations,
		stages: profileConfig.stages,
		thresholds: profileConfig.thresholds
	};

/**
 * Returns k6 options object from the loaded profile.
 *
 * When the profile uses `iterations` (e.g. quick), returns a fixed
 * iteration count with a single VU — no stages/ramp. Otherwise returns
 * the standard stage-based options for load/stress profiles.
 *
 * When scenario-specific thresholds are provided they take precedence.
 * Otherwise, thresholds fall back to the profile-level defaults defined in
 * the active config JSON (smoke.json, load.json, etc.).
 *
 * @param {object} [scenarioThresholds]
 * Threshold definitions specific to this scenario.
 *
 * @returns {object}
 * k6-compatible options object.
 */
export function getOptions(scenarioThresholds)
{
	// In iterations mode (quick), always use the permissive profile
	// thresholds — we are smoke-testing reachability, not performance.
	const useProfileThresholds =
		CONFIG.iterations != null;

	const opts =
		{
			thresholds: useProfileThresholds
				? CONFIG.thresholds
				: (scenarioThresholds ?? CONFIG.thresholds),
			insecureSkipTLSVerify: true
		};

	if (CONFIG.iterations)
	{
		opts.iterations =
			CONFIG.iterations;
		opts.vus =
			CONFIG.vus;
	}
	else
	{
		opts.stages =
			CONFIG.stages;
	}

	return opts;
}
