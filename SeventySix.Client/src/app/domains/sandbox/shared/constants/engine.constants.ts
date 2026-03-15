/**
 * Shared Babylon.js engine constants.
 * Injection tokens and configuration used by all sandbox games.
 */

import { InjectionToken } from "@angular/core";
import type { EngineOptions } from "@sandbox/shared/models/engine.models";

/**
 * Injection token for providing default engine options.
 * Used in test environments to inject NullEngine configuration.
 * @type {InjectionToken<EngineOptions>}
 */
export const BABYLON_ENGINE_OPTIONS: InjectionToken<EngineOptions> =
	new InjectionToken<EngineOptions>(
		"BABYLON_ENGINE_OPTIONS");