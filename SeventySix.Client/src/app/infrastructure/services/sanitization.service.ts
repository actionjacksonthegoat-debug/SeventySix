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
@Injectable({
	providedIn: "root"
})
export class SanitizationService
{
	private readonly sanitizer: DomSanitizer =
		inject(DomSanitizer);

	/**
	 * Sanitizes HTML content to prevent XSS.
	 */
	sanitizeHtml(html: string): SafeHtml
	{
		return this.sanitizer.sanitize(1, html) || "";
	}

	/**
	 * Sanitizes a URL to prevent XSS.
	 */
	sanitizeUrl(url: string): SafeUrl
	{
		return this.sanitizer.sanitize(4, url) || "";
	}

	/**
	 * Sanitizes a resource URL (for iframes, etc.).
	 */
	sanitizeResourceUrl(url: string): SafeResourceUrl
	{
		return this.sanitizer.sanitize(5, url) || "";
	}

	/**
	 * Bypasses sanitization for trusted HTML.
	 * Use with extreme caution - only for content you control.
	 */
	trustHtml(html: string): SafeHtml
	{
		return this.sanitizer.bypassSecurityTrustHtml(html);
	}

	/**
	 * Bypasses sanitization for trusted URLs.
	 * Use with extreme caution - only for URLs you control.
	 */
	trustUrl(url: string): SafeUrl
	{
		return this.sanitizer.bypassSecurityTrustUrl(url);
	}

	/**
	 * Strips HTML tags from a string.
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
