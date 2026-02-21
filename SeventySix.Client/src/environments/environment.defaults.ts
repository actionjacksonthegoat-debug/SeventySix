// <copyright file="environment.defaults.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { Environment } from "./environment.interface";

/**
 * Shared environment defaults reused across all environments.
 * Override specific keys in each environment file as needed.
 * Only values that are truly identical across environments belong here.
 */
export const ENVIRONMENT_DEFAULTS: Pick<Environment, "ui" | "http"> =
	{
		ui: {
			tables: {
				defaultPageSize: 50,
				pageSizeOptions: [25, 50, 100],
				virtualScrollItemSize: 48
			},
			performance: {
			/** Performance monitoring is enabled by default; disable in test/e2e environments. */
				enableMonitoring: true,
				fpsWarningThreshold: 30
			}
		},
		http: {
			defaultTimeout: 30000 // 30 seconds
		}
	} as const;