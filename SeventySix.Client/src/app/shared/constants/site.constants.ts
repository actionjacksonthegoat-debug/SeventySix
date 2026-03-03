// <copyright file="site.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Site-wide URL constants.
 * Single source of truth for the public domain — update here to propagate everywhere.
 */
export const SITE_CONSTANTS: Readonly<{
	url: string;
	iconUrl: string;
}> =
	{
		url: "https://seventysixsandbox.com",
		iconUrl: "https://seventysixsandbox.com/icons/icon-512x512.png"
	} as const;