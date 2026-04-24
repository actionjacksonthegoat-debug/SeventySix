/**
 * Reads the CSP nonce from the `ngCspNonce` attribute of the application root element.
 *
 * Angular recognises `ngCspNonce` on the root element at bootstrap and applies
 * the value to every `<style>` element it injects, satisfying `style-src 'nonce-…'`
 * CSP policies without `'unsafe-inline'`. This helper centralises the read logic
 * so it can be used in unit tests and any code that needs the runtime nonce value.
 *
 * @param rootElement
 *     The root DOM element (usually `<app-root>`), or `null` when no element is
 *     available (e.g. server-side / non-browser environments).
 * @returns
 *     The raw nonce string, or an empty string when the attribute is absent or the
 *     element is `null`.
 */
export function readNonceFromRoot(rootElement: Element | null): string
{
	if (rootElement === null)
	{
		return "";
	}

	return rootElement.getAttribute("ngcspnonce") ?? "";
}