/**
 * Configuration Loader for TanStack Load Tests
 *
 * Loads profile-specific configuration from config/*.json files
 * and merges with default settings. The profile is selected via
 * the PROFILE environment variable.
 *
 * @example
 * import { CONFIG, getOptions } from "../lib/config.js";
 * console.log(CONFIG.baseUrl);
 */

import { SharedArray } from "k6/data";

const profileName = __ENV.PROFILE || "quick";

/**
 * Loads and merges configuration from default.json and profile JSON.
 *
 * @type {SharedArray}
 */
const configData = new SharedArray("config", function loadConfig()
{
	const defaultConfig =
		JSON.parse(open("../config/default.json"));
	const profileConfig =
		JSON.parse(open(`../config/${profileName}.json`));

	return [Object.assign({}, defaultConfig, profileConfig)];
});

/** @type {{ baseUrl: string, vus?: number, duration?: string, iterations?: number, stages?: Array<{duration: string, target: number}> }} */
export const CONFIG = configData[0];

/**
 * Returns k6 options derived from the loaded configuration.
 *
 * @returns {object}
 * k6-compatible options object.
 */
export function getOptions()
{
	const options = {};

	if (CONFIG.vus !== undefined)
	{
		options.vus = CONFIG.vus;
	}
	if (CONFIG.duration !== undefined)
	{
		options.duration = CONFIG.duration;
	}
	if (CONFIG.iterations !== undefined)
	{
		options.iterations = CONFIG.iterations;
	}
	if (CONFIG.stages !== undefined)
	{
		options.stages = CONFIG.stages;
	}

	return options;
}
