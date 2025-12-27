import { inject, Injectable } from "@angular/core";
import {
	DomSanitizer,
	SafeHtml,
	SafeResourceUrl,
	SafeUrl
} from "@angular/platform-browser";

/**
 * Sanitization service.
 * Provides methods for sanitizing user input to prevent XSS attacks.
 */
@Injectable(
	{
		providedIn: "root"
	})
export class SanitizationService
{
	/**
	 * Angular DomSanitizer for sanitizing HTML and URLs.
	 * @type {DomSanitizer}
	 * @private
	 * @readonly
	 */
	private readonly sanitizer: DomSanitizer =
		inject(DomSanitizer);

	/**
	 * Sanitizes HTML content to prevent XSS.
	 * @param {string} html
	 * The HTML string to sanitize.
	 * @returns {SafeHtml}
	 * Sanitized HTML safe for insertion into the DOM.
	 */
	sanitizeHtml(html: string): SafeHtml
	{
		return this.sanitizer.sanitize(1, html) || "";
	}

	/**
	 * Sanitizes a URL to prevent XSS.
	 * @param {string} url
	 * The URL string to sanitize.
	 * @returns {SafeUrl}
	 * Sanitized URL safe for use in bindings.
	 */
	sanitizeUrl(url: string): SafeUrl
	{
		return this.sanitizer.sanitize(4, url) || "";
	}

	/**
	 * Sanitizes a resource URL (for iframes, etc.).
	 * @param {string} url
	 * The resource URL to sanitize.
	 * @returns {SafeResourceUrl}
	 * Sanitized resource URL safe for iframe usage.
	 */
	sanitizeResourceUrl(url: string): SafeResourceUrl
	{
		return this.sanitizer.sanitize(5, url) || "";
	}

	/**
	 * Bypasses sanitization for trusted HTML.
	 * Use with extreme caution - only for content you control.
	 * @param {string} html
	 * The trusted HTML to mark as safe.
	 * @returns {SafeHtml}
	 * Trusted HTML token suitable for binding.
	 */
	trustHtml(html: string): SafeHtml
	{
		return this.sanitizer.bypassSecurityTrustHtml(html);
	}

	/**
	 * Bypasses sanitization for trusted URLs.
	 * Use with extreme caution - only for URLs you control.
	 * @param {string} url
	 * The trusted URL to mark as safe.
	 * @returns {SafeUrl}
	 * Trusted URL token suitable for binding.
	 */
	trustUrl(url: string): SafeUrl
	{
		return this.sanitizer.bypassSecurityTrustUrl(url);
	}

	/**
	 * Strips HTML tags from a string.
	 * @param {string} html
	 * The HTML string to strip tags from.
	 * @returns {string}
	 * Plain text with HTML tags removed.
	 */
	stripHtml(html: string): string
	{
		const div: HTMLDivElement =
			document.createElement("div");
		div.innerHTML = html;
		return div.textContent || div.innerText || "";
	}

	/**
	 * Escapes HTML special characters.
	 * @param {string} text
	 * The text to escape for safe HTML output.
	 * @returns {string}
	 * Escaped text safe for insertion into HTML.
	 */
	escapeHtml(text: string): string
	{
		const map: Record<string, string> =
			{
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				"\"": "&quot;",
				"'": "&#039;"
			};
		return text.replace(/[&<>"']/g, (char) => map[char]);
	}

	/**
	 * Validates and sanitizes a URL to ensure it's safe.
	 * @param {string} url
	 * The URL to validate.
	 * @returns {string | null}
	 * The normalized safe URL if valid, otherwise null.
	 */
	validateUrl(url: string): string | null
	{
		try
		{
			const parsed: URL =
				new URL(url);
			// Only allow http/https protocols
			if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
			{
				return null;
			}
			return parsed.href;
		}
		catch
		{
			return null;
		}
	}
}
