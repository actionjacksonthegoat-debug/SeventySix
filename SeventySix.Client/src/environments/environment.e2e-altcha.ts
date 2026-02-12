import { environment as e2eEnvironment } from "./environment.e2e";
import { Environment } from "./environment.interface";

/**
 * E2E Test Environment Configuration with ALTCHA enabled.
 * Identical to the standard E2E environment except ALTCHA PoW is enabled.
 * Used by the separate "altcha" Playwright project to test ALTCHA integration.
 */
export const environment: Environment =
	{
		...e2eEnvironment,
		altcha: {
			enabled: true
		}
	};
