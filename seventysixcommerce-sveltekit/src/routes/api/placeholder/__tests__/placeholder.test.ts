import { describe, expect, it } from "vitest";

/**
 * Tests the placeholder SVG generation logic directly.
 * Mirrors the logic from the +server.ts route handler.
 */
function generatePlaceholderSvg(
	width: string,
	height: string,
	label: string): string
{
	const safeWidth: number =
		Math.min(Math.max(Number(width) || 600, 1), 2000);
	const safeHeight: number =
		Math.min(
			Math.max(Number(height) || 600, 1),
			2000);
	const safeLabel: string =
		decodeURIComponent(
			label || "Placeholder")
			.replace(/[<>&"']/g, "");

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${safeWidth}" height="${safeHeight}" viewBox="0 0 ${safeWidth} ${safeHeight}">
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
}

describe("Placeholder Image",
	() =>
	{
		it("generates SVG with correct dimensions",
			() =>
			{
				const svg: string =
					generatePlaceholderSvg("400", "300", "Test");
				expect(svg)
					.toContain("width=\"400\"");
				expect(svg)
					.toContain("height=\"300\"");
				expect(svg)
					.toContain("400 × 300");
			});

		it("includes the label text",
			() =>
			{
				const svg: string =
					generatePlaceholderSvg(
						"600",
						"600",
						"Neon Horizon");
				expect(svg)
					.toContain("Neon Horizon");
			});

		it("clamps dimensions to safe range",
			() =>
			{
				const svg: string =
					generatePlaceholderSvg("5000", "-10", "Test");
				expect(svg)
					.toContain("width=\"2000\"");
				expect(svg)
					.toContain("height=\"1\"");
			});

		it("sanitizes HTML entities in label",
			() =>
			{
				const svg: string =
					generatePlaceholderSvg(
						"600",
						"600",
						"<script>alert(\"xss\")</script>");
				expect(svg).not.toContain("<script>");
				expect(svg).not.toContain("\"xss\"");
			});

		it("defaults to 600x600 for invalid dimensions",
			() =>
			{
				const svg: string =
					generatePlaceholderSvg("abc", "xyz", "Test");
				expect(svg)
					.toContain("width=\"600\"");
				expect(svg)
					.toContain("height=\"600\"");
			});
	});