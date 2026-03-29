import {
	PLACEHOLDER_CACHE_MAX_AGE,
	PLACEHOLDER_DEFAULT_SIZE,
	PLACEHOLDER_MAX_SIZE,
	PLACEHOLDER_MIN_SIZE
} from "$lib/constants";
import type { RequestHandler } from "./$types";

/**
 * Generates a placeholder SVG image with the given dimensions and label.
 * URL format: /api/placeholder/[width]/[height]/[label]
 */
export const GET: RequestHandler =
	({ params }) =>
	{
		const safeWidth: number =
			Math.min(
				Math.max(Number(params.width) || PLACEHOLDER_DEFAULT_SIZE, PLACEHOLDER_MIN_SIZE),
				PLACEHOLDER_MAX_SIZE);
		const safeHeight: number =
			Math.min(
				Math.max(Number(params.height) || PLACEHOLDER_DEFAULT_SIZE, PLACEHOLDER_MIN_SIZE),
				PLACEHOLDER_MAX_SIZE);
		const safeLabel: string =
			decodeURIComponent(
				params.label ?? "Placeholder")
				.replace(/[<>&"'`/]/g, "")
				.slice(0, 100);

		const svg: string =
			`<svg xmlns="http://www.w3.org/2000/svg" width="${safeWidth}" height="${safeHeight}" viewBox="0 0 ${safeWidth} ${safeHeight}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#e2e8f0" font-family="system-ui, sans-serif" font-size="20" font-weight="600">${safeLabel}</text>
  <text x="50%" y="60%" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="14">${safeWidth} × ${safeHeight}</text>
</svg>`;

		return new Response(svg,
			{
				headers: {
					"Content-Type": "image/svg+xml",
					"Cache-Control": `public, max-age=${PLACEHOLDER_CACHE_MAX_AGE}`
				}
			});
	};