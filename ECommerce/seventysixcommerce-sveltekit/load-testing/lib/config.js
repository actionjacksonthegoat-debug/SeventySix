/**
 * k6 Configuration Loader
 *
 * Reads the profile from __ENV.PROFILE (smoke|load|stress|quick)
 * and merges with default.json for base settings.
 *
 * @example
 * import { CONFIG, getOptions } from "../lib/config.js";
 * export const options = getOptions(THRESHOLDS.STANDARD);
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

/**
 * Merged configuration object.
 */
export const CONFIG =
	{
		baseUrl: BASE_URL,
		profile: PROFILE_NAME,
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
 * iteration count. Otherwise returns the standard stage-based options.
 *
 * When scenario-specific thresholds are provided they take precedence.
 * Otherwise, thresholds fall back to the profile-level defaults.
 *
 * @param {object} [scenarioThresholds]
 * Threshold definitions specific to this scenario.
 *
 * @returns {object}
 * k6-compatible options object.
 */
export function getOptions(scenarioThresholds)
{
	const useProfileThresholds =
		CONFIG.iterations != null;

	const opts =
		{
			thresholds: useProfileThresholds
				? CONFIG.thresholds
				: (scenarioThresholds ?? CONFIG.thresholds)
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
