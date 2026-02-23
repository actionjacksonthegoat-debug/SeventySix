/**
 * Checks whether a URL is a safe relative URL that can be used for client-side navigation.
 *
 * A safe relative URL must:
 * - Start with a single forward slash `/`
 * - NOT start with `//` (protocol-relative URLs can redirect to external origins)
 * - NOT be an absolute URL (e.g., `https://evil.com`)
 *
 * This guard is required because CodeQL treats storage APIs (sessionStorage, localStorage)
 * as tainted sources for `js/client-side-unvalidated-url-redirect`. Values read from
 * storage must be re-validated at the point of navigation even if they were validated
 * before storage.
 *
 * @param {string} url
 * The URL string to validate.
 *
 * @returns {boolean}
 * True if the URL is a safe relative path, false otherwise.
 *
 * @example
 * ```typescript
 * isSafeRelativeUrl("/dashboard")        // true
 * isSafeRelativeUrl("/admin/users")      // true
 * isSafeRelativeUrl("//evil.com/steal")  // false — protocol-relative
 * isSafeRelativeUrl("https://evil.com")  // false — absolute URL
 * isSafeRelativeUrl("javascript:alert(1)") // false — no leading slash
 * isSafeRelativeUrl("")                  // false — empty string
 * ```
 */
export function isSafeRelativeUrl(url: string): boolean
{
	return url.startsWith("/") && !url.startsWith("//");
}

/**
 * Returns the URL if it is a safe relative URL, or `"/"` as a safe fallback.
 *
 * Use this at the point of navigation when reading a URL from session/local storage,
 * query parameters, or other external (CodeQL-tainted) sources.
 *
 * @param {string} url
 * The URL string to validate.
 *
 * @returns {string}
 * The original URL if safe, or `"/"` as a fallback.
 *
 * @example
 * ```typescript
 * const stored: string = sessionStorage.getItem("returnUrl") ?? "/";
 * this.router.navigateByUrl(sanitizeReturnUrl(stored));
 * ```
 */
export function sanitizeReturnUrl(url: string): string
{
	return isSafeRelativeUrl(url)
		? url
		: "/";
}